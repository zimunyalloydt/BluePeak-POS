import api from "./api";

export async function getAdminDashboard() {
    const response = await api.get("/admin/dashboard");

    return response.data;
}

export async function getAdminSales() {
    const response = await api.get("/admin/sales");

    return response.data;
}

export async function getAdminUsers() {
    const response = await api.get("/admin/users");

    return response.data;
}

export async function createAdminUser(user: any) {
    const response = await api.post(
        "/admin/users",
        user
    );

    return response.data;
}

export async function getUserPermissions(
    userId: number
) {
    const response = await api.get(
        `/admin/users/${userId}/permissions`
    );

    return response.data;
}

export async function updateUserPermissions(
    userId: number,
    permissionIds: number[]
) {
    const response = await api.put(
        `/admin/users/${userId}/permissions`,
        {
            permissionIds,
        }
    );

    return response.data;
}