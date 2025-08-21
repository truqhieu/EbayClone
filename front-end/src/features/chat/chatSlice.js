import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:9999/api";

// Async thunk: fetch conversations
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token found");

      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.conversations;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversations"
      );
    }
  }
);

// Async thunk: fetch messages in conversation
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token found");

      const response = await axios.get(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return { conversationId, messages: response.data.messages };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

// Async thunk: start conversation
export const startConversation = createAsyncThunk(
  "chat/startConversation",
  async (userId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token found");

      const response = await axios.get(
        `${API_URL}/chat/conversations/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.conversation;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to start conversation"
      );
    }
  }
);

// 🔹 Async thunk: delete message
export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token found");

      const response = await axios.delete(
        `${API_URL}/chat/messages/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data; // { deletedMessageId, conversationId }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete message"
      );
    }
  }
);

// 🔹 NEW: Async thunk: delete conversation
export const deleteConversation = createAsyncThunk(
  "chat/deleteConversation",
  async (conversationId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      if (!token) return rejectWithValue("No token found");

      const response = await axios.delete(
        `${API_URL}/chat/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return { conversationId, ...response.data }; // Return conversationId for state update
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete conversation"
      );
    }
  }
);

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  loading: false,
  error: null,
  onlineUsers: {},
  typingUsers: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);

      // Update lastMessage
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv._id === conversationId
      );
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = message;
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    },
    markMessagesAsRead: (state, action) => {
      const { conversationId, messageIds } = action.payload;
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(
          (message) =>
            messageIds.includes(message._id)
              ? { ...message, read: true }
              : message
        );
      }
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv._id === conversationId
      );
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].unreadCount = 0;
      }
    },
    updateOnlineStatus: (state, action) => {
      const { userId, status } = action.payload;
      state.onlineUsers[userId] = status === "online";
    },
    updateTypingStatus: (state, action) => {
      const { userId, conversationId, isTyping } = action.payload;
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {};
      }
      state.typingUsers[conversationId][userId] = isTyping;
    },
    incrementUnreadCount: (state, action) => {
      const { conversationId } = action.payload;
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv._id === conversationId
      );
      if (conversationIndex !== -1) {
        const currentCount =
          state.conversations[conversationIndex].unreadCount || 0;
        state.conversations[conversationIndex].unreadCount = currentCount + 1;
      }
    },
    clearChatState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // fetchMessages
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
        state.loading = false;

        const conversationIndex = state.conversations.findIndex(
          (conv) => conv._id === conversationId
        );
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].unreadCount = 0;
        }
      })

      // startConversation
      .addCase(startConversation.fulfilled, (state, action) => {
        const existingIndex = state.conversations.findIndex(
          (conv) => conv._id === action.payload._id
        );
        if (existingIndex === -1) {
          state.conversations.unshift(action.payload);
        }
        state.activeConversation = action.payload._id;
        state.loading = false;
      })

      // 🔹 deleteMessage
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { deletedMessageId, conversationId } = action.payload;

        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[
            conversationId
          ].filter((msg) => msg._id !== deletedMessageId);
        }

        const convIndex = state.conversations.findIndex(
          (c) => c._id === conversationId
        );
        if (convIndex !== -1) {
          const latestMsg =
            state.messages[conversationId]?.[
              state.messages[conversationId].length - 1
            ] || null;
          state.conversations[convIndex].lastMessage = latestMsg;
        }
      })

      // 🔹 NEW: deleteConversation
      .addCase(deleteConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;

        // Remove conversation from conversations array
        state.conversations = state.conversations.filter(
          (conv) => conv._id !== conversationId
        );

        // Remove messages for this conversation
        delete state.messages[conversationId];

        // Clear active conversation if it's the one being deleted
        if (state.activeConversation === conversationId) {
          state.activeConversation = null;
        }

        state.loading = false;
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const {
  setActiveConversation,
  addMessage,
  markMessagesAsRead,
  updateOnlineStatus,
  updateTypingStatus,
  incrementUnreadCount,
  clearChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
