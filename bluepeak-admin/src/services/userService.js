import api from "./api";

export async function getUsers() {
    const response = await api.get("/admin/users");
    return response.data;
}

export async function createUser(user) {
    await api.post("/admin/users", user);
}

export async function getChatUsers() {
    const { data } = await api.get("/users/chat-users");
    return data;
}


