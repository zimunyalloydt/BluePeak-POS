import api from "./api";

export async function getAdminDashboard() {
    const { data } = await api.get("/admin/dashboard");
    return data;
}

export async function getAdminSales() {
    const { data } = await api.get("/admin/sales");
    return data;
}

export async function getAdminUsers() {
    const { data } = await api.get("/admin/users");
    return data;
}

export async function createAdminUser(user: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    roleId: number;
    isActive: boolean;
}) {
    const { data } = await api.post("/admin/users", user);
    return data;
}

export async function getUserPermissions(userId: number) {
    const { data } = await api.get(
        `/admin/users/${userId}/permissions`
    );

    return data;
}

export async function updateUserPermissions(
    userId: number,
    permissionIds: number[]
) {
    const { data } = await api.put(
        `/admin/users/${userId}/permissions`,
        {
            permissionIds,
        }
    );

    return data;
}
export async function getAdminSaleDetails(saleId: number) {
    const { data } = await api.get(
        `/admin/sales/${saleId}`
    );

    return data;
}