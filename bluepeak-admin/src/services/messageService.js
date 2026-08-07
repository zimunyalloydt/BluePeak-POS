import api from "./api";

export async function getChats() {
    const { data } = await api.get("/messages/chats");
    return data;
}

export async function getConversation(userId) {
    const { data } = await api.get(`/messages/conversation/${userId}`);
    return data;
}

export async function sendMessage(receiverUserId, text) {
    const { data } = await api.post("/messages", {
        receiverUserId,
        text,
    });

    return data;
}

export async function markAsRead(messageId) {
    await api.put(`/messages/read/${messageId}`);
}

export async function getUnreadCount() {
    const { data } = await api.get("/messages/unread-count");
    return data;
}