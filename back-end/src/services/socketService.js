const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Message, Conversation } = require('../models');
const logger = require('../utils/logger');
const { getRedisAdapter, cache } = require('../config/redis');

// Map to store online users: { userId: socketId }
// In cluster mode, this will be shared via Redis
const onlineUsers = new Map();

// Initialize Socket.IO server
const initSocketServer = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Set up Redis adapter for multi-instance Socket.IO
  try {
    const adapter = getRedisAdapter();
    io.adapter(adapter);
    logger.info('Socket.IO Redis adapter initialized');
  } catch (error) {
    logger.warn('Redis adapter not available, using default adapter:', error.message);
  }

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected: ${userId} (PID: ${process.pid})`);
    
    // Add user to online users map
    onlineUsers.set(userId, socket.id);
    
    // Store online status in Redis for cross-instance awareness
    try {
      await cache.set(`user:${userId}:online`, {
        socketId: socket.id,
        pid: process.pid,
        timestamp: Date.now()
      }, 3600); // 1 hour TTL
    } catch (error) {
      logger.error('Error storing user online status in Redis:', error);
    }
    
    // Broadcast user online status
    io.emit('userStatus', { userId, status: 'online' });
    
    // Handle join conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      logger.info(`User ${userId} joined conversation ${conversationId}`);
    });
    
    // Handle leave conversation
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });
    
    // Handle new message
    socket.on('sendMessage', async (messageData) => {
      try {
        const { recipientId, content, conversationId, image } = messageData;
        
        // Create new message
        const messagePayload = {
          sender: userId,
          recipient: recipientId,
          conversationId,
          read: false
        };
        
        // Add content if provided
        if (content) {
          messagePayload.content = content;
        }
        
        // Add image if provided
        if (image) {
          messagePayload.image = {
            public_id: image.public_id,
            url: image.url,
            secure_url: image.secure_url
          };
        }
        
        const newMessage = new Message(messagePayload);
        
        await newMessage.save();
        await newMessage.populate('sender', 'username fullname avatarURL');
        
        // Update or create conversation
        let conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          // This should not happen normally, but just in case
          conversation = new Conversation({
            _id: conversationId,
            participants: [userId, recipientId],
            lastMessage: newMessage._id,
            unreadCount: new Map([[recipientId, 1]])
          });
        } else {
          // Update last message
          conversation.lastMessage = newMessage._id;
          
          // Increment unread count for recipient
          const currentCount = conversation.unreadCount.get(recipientId) || 0;
          conversation.unreadCount.set(recipientId, currentCount + 1);
        }
        
        await conversation.save();
        
        // Emit message to conversation room
        io.to(conversationId).emit('newMessage', newMessage);
        
        // Notify recipient if they're not in the conversation room
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('messageNotification', {
            message: newMessage,
            conversationId
          });
        }
        
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('messageError', { message: 'Failed to send message' });
      }
    });
    
    // Handle read receipts
    socket.on('markAsRead', async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { read: true }
        );
        
        // Update conversation unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.unreadCount.set(userId, 0);
          await conversation.save();
        }
        
        // Emit read receipt to conversation
        io.to(conversationId).emit('messagesRead', {
          reader: userId,
          messageIds
        });
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    });
    
    // Handle user typing status
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('userTyping', {
        userId,
        isTyping
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId} (PID: ${process.pid})`);
      
      // Remove user from online users map
      onlineUsers.delete(userId);
      
      // Remove online status from Redis
      try {
        await cache.del(`user:${userId}:online`);
      } catch (error) {
        logger.error('Error removing user online status from Redis:', error);
      }
      
      // Broadcast user offline status
      io.emit('userStatus', { userId, status: 'offline' });
    });
  });
  
  return io;
};

module.exports = { initSocketServer }; 