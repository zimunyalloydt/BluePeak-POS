import api from "./api";

export async function getUserPermissions(userId) {
    const response = await api.get(`/admin/users/${userId}/permissions`);
    return response.data;
}

export async function saveUserPermissions(userId, permissionIds) {
    await api.put(`/admin/users/${userId}/permissions`, {
        permissionIds
    });
}