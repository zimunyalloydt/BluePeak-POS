import api from "./api";

export async function getMySales() {
    const response = await api.get("/Sales/my-sales");
    return response.data;
}

export async function getReceipt(id) {
    const response = await api.get(`/Sales/${id}`);
    return response.data;
}

export async function createSale(data) {
    const response = await api.post("/Sales", data);
    return response.data;
}

export async function createRefundRequest(data) {
    const response = await api.post("/Refunds", data);
    return response.data;
}