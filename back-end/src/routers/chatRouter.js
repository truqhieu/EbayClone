const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const chatController = require("../controllers/chatController");

const chatRouter = express.Router();

// Apply authentication middleware to all chat routes
chatRouter.use(authMiddleware);

// Get all conversations for the current user
chatRouter.get("/conversations", chatController.getConversations);

// Get messages for a specific conversation
chatRouter.get(
  "/conversations/:conversationId/messages",
  chatController.getMessages
);

// Find or create a conversation with another user
chatRouter.get(
  "/conversations/user/:recipientId",
  chatController.findOrCreateConversation
);

// Delete a specific message
chatRouter.delete("/messages/:messageId", chatController.deleteMessage);

// Delete an entire conversation
chatRouter.delete(
  "/conversations/:conversationId",
  chatController.deleteConversation
);

module.exports = chatRouter;
