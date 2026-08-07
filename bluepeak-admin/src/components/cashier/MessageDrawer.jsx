import { useEffect, useState, useCallback } from "react";
import {
    FaArrowLeft,
    FaPaperPlane,
    FaTimes,
    FaPlus,
    FaSearch,
    FaComments
} from "react-icons/fa";


import {
    on,
    off
} from "../../services/signalRService";
import {
    getChats,
    getConversation,
    sendMessage
} from "../../services/messageService";
import { getChatUsers } from "../../services/userService";

export default function MessageDrawer({
    open,
    onClose
}) {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [showUsers, setShowUsers] = useState(false);
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const loadChats = useCallback(async () => {
        try {
            const data = await getChats();
            setChats(data);
        } catch (error) {
            console.error("Error loading chats:", error);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const data = await getChatUsers();
            setUsers(data);
        } catch (error) {
            console.error("Error loading users:", error);
        }
    }, []);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            setCurrentUser(user);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        loadChats();
    }, [open, loadChats]);

    useEffect(() => {
        const handleReceiveMessage = (message) => {
            setMessages(prev => [...prev, message]);
            setUnreadMessages(prev => prev + 1);
            loadChats();
        };

        on("ReceiveMessage", handleReceiveMessage);

        return () => {
            off("ReceiveMessage", handleReceiveMessage);
        };
    }, [loadChats]);

    const openChat = useCallback(async (chat) => {
        try {
            setSelectedChat(chat);

            if (!currentUser) return;

            const otherUser = chat.senderUserId === currentUser.userId
                ? chat.receiverUserId
                : chat.senderUserId;

            const data = await getConversation(otherUser);
            setMessages(data || []);
            setUnreadMessages(0); // Reset unread count when opening chat
        } catch (error) {
            console.error("Error opening chat:", error);
        }
    }, [currentUser]);

    const handleSend = useCallback(async () => {
        if (!text.trim() || !selectedChat || !currentUser) return;

        try {
            const receiverId = selectedChat.senderUserId === currentUser.userId
                ? selectedChat.receiverUserId
                : selectedChat.senderUserId;

            await sendMessage(receiverId, text);
            setText("");

            // Reload conversation after sending
            const data = await getConversation(receiverId);
            setMessages(data || []);
            await loadChats();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }, [text, selectedChat, currentUser, loadChats]);

    const handleUserSelect = async (user) => {
        try {
            setShowUsers(false);
            setSearch("");
            
            if (!currentUser) return;

            // Check if chat already exists
            const existingChat = chats.find(chat => 
                (chat.senderUserId === currentUser.userId && chat.receiverUserId === user.userId) ||
                (chat.senderUserId === user.userId && chat.receiverUserId === currentUser.userId)
            );

            if (existingChat) {
                openChat(existingChat);
            } else {
                // Open conversation with user
                const data = await getConversation(user.userId);
                setMessages(data || []);
                
                // Create a temporary chat object for display
                setSelectedChat({
                    senderUserId: currentUser.userId,
                    receiverUserId: user.userId,
                    senderName: currentUser.name || currentUser.username || "",
                    receiverName: user.name || user.username || ""
                });
                setUnreadMessages(0); // Reset unread count
            }
        } catch (error) {
            console.error("Error selecting user:", error);
        }
    };

    if (!open) return null;

    const getDisplayName = (chat) => {
        if (!currentUser) return "Unknown";
        return chat.senderUserId === currentUser.userId
            ? chat.receiverName
            : chat.senderName;
    };

    const filteredUsers = users.filter(user => 
        user.userId !== currentUser?.userId &&
        (user.name?.toLowerCase().includes(search.toLowerCase()) ||
         user.username?.toLowerCase().includes(search.toLowerCase()))
    );

    // Format timestamp helper
    const formatTime = (dateString) => {
        if (!dateString) return "";
        try {
            return new Date(dateString).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (error) {
            return "";
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-0 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                {selectedChat ? (
                    <>
                        <button onClick={() => setSelectedChat(null)}>
                            <FaArrowLeft />
                        </button>
                        <h2 className="font-bold flex-1 text-center">
                            {getDisplayName(selectedChat)}
                        </h2>
                    </>
                ) : (
                    <div className="flex items-center gap-3 flex-1">
                        <h2 className="font-bold text-lg">
                            Messages
                            {unreadMessages > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                    {unreadMessages}
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={async () => {
                                await loadUsers();
                                setShowUsers(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            <FaPlus />
                        </button>
                    </div>
                )}
                <button onClick={onClose}>
                    <FaTimes />
                </button>
            </div>

            {showUsers ? (
                <div className="absolute inset-0 bg-white z-10 flex flex-col">
                    <div className="flex items-center p-4 border-b gap-2">
                        <button 
                            onClick={() => {
                                setShowUsers(false);
                                setSearch("");
                            }}
                            className="text-gray-600"
                        >
                            <FaArrowLeft />
                        </button>
                        <h3 className="font-bold flex-1">New Message</h3>
                        <button onClick={() => {
                            setShowUsers(false);
                            setSearch("");
                        }}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="p-4 border-b">
                        <div className="flex items-center border rounded-lg px-3 bg-gray-50">
                            <FaSearch className="text-gray-400 mr-2" />
                            <input
                                className="flex-1 py-2 bg-transparent focus:outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search users..."
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center text-gray-500 p-8">
                                {search ? "No users found" : "No users available"}
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.userId}
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full text-left p-4 hover:bg-gray-100 border-b transition-colors"
                                >
                                    <div className="font-semibold">
                                        {user.name || user.username}
                                    </div>
                                    {user.email && (
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    )}
                                    {user.role && (
                                        <div className="text-xs text-gray-400">
                                            {user.role}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : !selectedChat ? (
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <div className="text-center text-gray-500 p-8">
                            No conversations yet
                            <button
                                onClick={async () => {
                                    await loadUsers();
                                    setShowUsers(true);
                                }}
                                className="block mx-auto mt-4 text-blue-600 hover:text-blue-800"
                            >
                                Start a new conversation
                            </button>
                        </div>
                    ) : (
                        chats.map(chat => {
                            const name = getDisplayName(chat);
                            return (
                                <button
                                    key={chat.messageId || chat.chatId || Math.random()}
                                    onClick={() => openChat(chat)}
                                    className="w-full text-left border-b p-4 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="font-semibold">
                                        {name}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                        {chat.text || "No message"}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500">
                                No messages yet. Start a conversation!
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isOwnMessage = currentUser && msg.senderUserId === currentUser.userId;
                                return (
                                    <div
                                        key={msg.messageId || Math.random()}
                                        className={`rounded-xl p-3 max-w-[80%] ${
                                            isOwnMessage 
                                                ? "bg-blue-500 text-white ml-auto" 
                                                : "bg-gray-100"
                                        }`}
                                    >
                                        <div>
                                            <div>
                                                {msg.text}
                                            </div>
                                            {msg.sentAt && (
                                                <div className={`text-[11px] mt-1 text-right ${
                                                    isOwnMessage ? "opacity-70" : "text-gray-500"
                                                }`}>
                                                    {formatTime(msg.sentAt)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t p-3 flex gap-2">
                        <input
                            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type a message..."
                            onKeyPress={e => {
                                if (e.key === 'Enter') {
                                    handleSend();
                                }
                            }}
                        />
                        <button
                            onClick={handleSend}
                            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={!text.trim()}
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}