import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteMessage } from "../../features/chat/chatSlice";

const MessageList = ({ conversationId }) => {
  const dispatch = useDispatch();
  const { messages, typingUsers } = useSelector((state) => state.chat);
  const currentUser = useSelector((state) => state.auth.user);
  const messagesEndRef = useRef(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const conversationMessages = messages[conversationId] || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

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

  // Check if someone is typing in this conversation
  const isTyping = Object.values(typingUsers[conversationId] || {}).some(
    (typing) => typing
  );

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          Please login to view messages
        </div>
      </div>
    );
  }

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleMessageOptionsClick = (e, messageId) => {
    e.stopPropagation();
    setShowDeleteMenu(showDeleteMenu === messageId ? null : messageId);
  };

  const handleDeleteClick = (messageId) => {
    setConfirmDelete(messageId);
    setShowDeleteMenu(null);
  };

  // 🔹 Fixed delete function - dispatch the action directly
  const confirmDeleteMessage = async () => {
    if (confirmDelete) {
      try {
        await dispatch(deleteMessage(confirmDelete)).unwrap();
        setConfirmDelete(null);
        console.log("Message deleted successfully");
      } catch (error) {
        console.error("Failed to delete message:", error);
        // You can add error handling here (show toast, etc.)
        setConfirmDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {conversationMessages.length === 0 && (
        <div className="text-center text-gray-500 my-10">
          No messages yet. Start the conversation!
        </div>
      )}

      {conversationMessages.map((message, index) => {
        if (!message || !message.sender) return null;

        // ✅ Fix chỗ so sánh ID
        const isMine =
          message.sender._id === currentUser._id ||
          message.sender._id === currentUser.id;

        const showAvatar =
          index === 0 ||
          conversationMessages[index - 1]?.sender?._id !== message.sender._id;

        const hasImage =
          message.image && (message.image.url || message.image.secure_url);
        const imageUrl = hasImage
          ? message.image.secure_url || message.image.url
          : null;

        return (
          <div
            key={message._id}
            className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
          >
            <div className={`max-w-[70%] relative`}>
              <div
                className={`p-3 rounded-lg relative ${
                  isMine
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-gray-200 text-gray-800 rounded-tl-none"
                }`}
              >
                {/* Chỉ hiện menu nếu là tin nhắn của mình */}
                {isMine && (
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleMessageOptionsClick(e, message._id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 text-xs"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {showDeleteMenu === message._id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                        <button
                          onClick={() => handleDeleteClick(message._id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
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
                          Delete Message
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {message.content && (
                  <div className={hasImage ? "mb-2" : ""}>
                    {message.content}
                  </div>
                )}

                {hasImage && (
                  <div className="mt-1">
                    <img
                      src={imageUrl}
                      alt="Message attachment"
                      className="max-w-full max-h-64 rounded cursor-pointer"
                      onClick={() => handleImageClick(imageUrl)}
                    />
                  </div>
                )}
              </div>

              <div
                className={`text-xs mt-1 ${
                  isMine ? "text-right" : "text-left"
                } text-gray-500`}
              >
                {message.createdAt &&
                  new Date(message.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                {isMine && message.read && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-200 p-3 rounded-lg text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-400"></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Message
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMessage}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 text-black"
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
