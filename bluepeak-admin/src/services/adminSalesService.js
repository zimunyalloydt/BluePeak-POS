import api from "./api";

export async function getSales() {
    const response = await api.get("/admin/sales");
    return response.data;
}

export async function getSaleDetails(id) {
    const response = await api.get(`/admin/sales/${id}`);
    return response.data;
}