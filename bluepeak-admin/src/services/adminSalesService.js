import api from "./api";

export async function getSales() {
    const response = await api.get("/admin/sales");
    return response.data;
}