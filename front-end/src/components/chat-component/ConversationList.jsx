import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteConversation } from "../../features/chat/chatSlice";

const ConversationList = ({ onSelectConversation }) => {
  const dispatch = useDispatch();
  const { conversations, activeConversation, onlineUsers, loading } =
    useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.auth.user);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDeleteMenu(null);
    };

    if (showDeleteMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDeleteMenu]);

  // Filter conversations based on search term
  const filteredConversations =
    conversations?.filter((conversation) => {
      if (!searchTerm.trim()) return true;

      const otherUser = conversation.participant;
      const searchLower = searchTerm.toLowerCase();

      return (
        otherUser?.fullname?.toLowerCase().includes(searchLower) ||
        otherUser?.username?.toLowerCase().includes(searchLower) ||
        conversation.lastMessage?.content?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const formatTimeAgo = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return messageDate.toLocaleDateString();
  };

  const handleConversationOptionsClick = (e, conversationId) => {
    e.stopPropagation();
    setShowDeleteMenu(
      showDeleteMenu === conversationId ? null : conversationId
    );
  };

  const handleDeleteConversation = (conversationId) => {
    setConfirmDelete(conversationId);
    setShowDeleteMenu(null);
  };

  const confirmDeleteConversation = async () => {
    if (confirmDelete) {
      try {
        await dispatch(deleteConversation(confirmDelete)).unwrap();
        console.log("Conversation deleted successfully");
        setConfirmDelete(null);
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        setConfirmDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar - Always visible */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search Users"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search results count */}
        {searchTerm.trim() && (
          <div className="mt-2 text-xs text-gray-500">
            {filteredConversations.length === 0
              ? "No conversations found"
              : `${filteredConversations.length} conversation${
                  filteredConversations.length !== 1 ? "s" : ""
                } found`}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {!conversations || conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : filteredConversations.length === 0 && searchTerm.trim() ? (
          <div className="p-4 text-center text-gray-500">
            No conversations match your search
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            // Skip conversations with missing participants
            if (!conversation || !conversation.participant) return null;

            const otherUser = conversation.participant;
            const isOnline = onlineUsers[otherUser?._id];
            const isActive = activeConversation === conversation._id;

            return (
              <div
                key={conversation._id || `conv-${Math.random()}`}
                className={`flex items-center p-3 border-b border-gray-200 hover:bg-gray-100 cursor-pointer relative group ${
                  isActive ? "bg-blue-50" : ""
                }`}
                onClick={() => onSelectConversation(conversation._id)}
              >
                {/* User avatar with online indicator */}
                <div className="relative mr-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {otherUser?.avatarURL ? (
                      <img
                        src={otherUser.avatarURL}
                        alt={otherUser.username || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-600">
                        {otherUser?.fullname?.[0] ||
                          otherUser?.username?.[0] ||
                          "?"}
                      </span>
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>

                {/* Conversation details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 truncate">
                      {otherUser?.fullname ||
                        otherUser?.username ||
                        "Unknown User"}
                    </h3>
                    {conversation.lastMessage?.createdAt && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content
                        ? conversation.lastMessage.sender === currentUser?.id
                          ? `You: ${conversation.lastMessage.content}`
                          : conversation.lastMessage.content
                        : "No messages yet"}
                    </p>

                    {/* Unread indicator */}
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Conversation options button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) =>
                      handleConversationOptionsClick(e, conversation._id)
                    }
                    className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 text-xs"
                    disabled={loading}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {/* Delete menu */}
                  {showDeleteMenu === conversation._id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                      <button
                        onClick={() =>
                          handleDeleteConversation(conversation._id)
                        }
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center whitespace-nowrap"
                        disabled={loading}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete Conversation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Conversation
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this entire conversation? All
              messages will be permanently deleted and this action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConversation}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
