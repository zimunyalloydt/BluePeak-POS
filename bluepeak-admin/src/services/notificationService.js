import api from "./api";

export const getNotifications = async () => {
    const { data } = await api.get("/notifications");
    return data;
};

export const getUnreadCount = async () => {
    const { data } = await api.get("/notifications/unread-count");
    return data;
};

export const markAsRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
};