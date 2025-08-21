const { User, Message, Conversation } = require("../models");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

/**
 * Get all conversations for the current user
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username fullname avatarURL",
      })
      .populate({
        path: "lastMessage",
        select: "content createdAt sender",
      })
      .sort({ updatedAt: -1 });

    // Format response to include participant details (excluding current user)
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    logger.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching conversations",
    });
  }
};

/**
 * Get all messages for a specific conversation
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Validate conversationId format
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID format",
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    // Get messages paginated
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversationId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "sender",
        select: "username fullname avatarURL",
      });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        read: false,
      },
      { read: true }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    return res.status(200).json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    logger.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching messages",
    });
  }
};

/**
 * Find or create a conversation with another user
 */
const findOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId } = req.params;

    // Validate recipientId format
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient ID format",
      });
    }

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found",
      });
    }

    // Find existing conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
    }).populate({
      path: "participants",
      select: "username fullname avatarURL",
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        conversation,
      });
    }

    // Create new conversation
    const newConversation = await Conversation.create({
      participants: [userId, recipientId],
      unreadCount: new Map([
        [recipientId, 0],
        [userId, 0],
      ]),
    });

    await newConversation.populate({
      path: "participants",
      select: "username fullname avatarURL",
    });

    return res.status(201).json({
      success: true,
      conversation: newConversation,
    });
  } catch (error) {
    logger.error("Error creating conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating conversation",
    });
  }
};

/**
 * Delete a message (only sender can delete their own messages)
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Validate messageId format
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if the current user is the sender of the message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    // Store conversation ID before deletion
    const conversationId = message.conversationId;

    // Delete the message
    const deletedMessage = await Message.findByIdAndDelete(messageId);
    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found or already deleted",
      });
    }

    // Find the conversation to update lastMessage if necessary
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.lastMessage?.toString() === messageId) {
      // Find the new last message
      const newLastMessage = await Message.findOne({
        conversationId: conversationId,
      })
        .sort({ createdAt: -1 })
        .select("_id content createdAt sender");

      // Update conversation's lastMessage
      conversation.lastMessage = newLastMessage?._id || null;
      conversation.updatedAt = new Date();
      await conversation.save();
    }

    logger.info(`Message ${messageId} deleted successfully by user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      deletedMessageId: messageId,
      conversationId: conversationId,
    });
  } catch (error) {
    logger.error("Error deleting message:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    console.log(
      `Delete conversation request: conversationId=${conversationId}, userId=${userId}`
    );

    // Validate conversationId format
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log("Invalid conversation ID format");
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID format",
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    console.log("Found conversation:", conversation ? "Yes" : "No");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Check if user is a participant - more flexible approach
    const participantIds = conversation.participants.map((p) => p.toString());
    const isParticipant = participantIds.includes(userId.toString());

    console.log("Participants:", participantIds);
    console.log("User ID:", userId.toString());
    console.log("Is participant:", isParticipant);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this conversation",
      });
    }

    try {
      // Delete all messages in the conversation first
      console.log("Deleting messages...");
      const deleteMessagesResult = await Message.deleteMany({
        conversationId: new mongoose.Types.ObjectId(conversationId),
      });
      console.log("Messages deleted:", deleteMessagesResult.deletedCount);

      // Delete the conversation
      console.log("Deleting conversation...");
      const deleteConversationResult = await Conversation.findByIdAndDelete(
        conversationId
      );

      if (!deleteConversationResult) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or already deleted",
        });
      }

      console.log("Conversation deleted successfully");

      logger.info(
        `Conversation ${conversationId} deleted successfully by user ${userId}. Deleted ${deleteMessagesResult.deletedCount} messages.`
      );

      return res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
        deletedConversationId: conversationId,
        deletedMessagesCount: deleteMessagesResult.deletedCount,
      });
    } catch (deleteError) {
      console.error("Error during deletion process:", deleteError);
      logger.error("Error during deletion process:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Error during deletion process",
        error:
          process.env.NODE_ENV === "development"
            ? deleteError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
    logger.error("Error deleting conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting conversation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  findOrCreateConversation,
  deleteMessage,
  deleteConversation,
};
