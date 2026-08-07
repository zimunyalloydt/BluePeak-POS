import api from "./api";

export async function getProducts() {
    const response = await api.get("/product");
    return response.data;
}

export async function createProduct(formData) {

    console.log([...formData.entries()]);

    return await api.post("/product", formData);

}

export async function updateProduct(id, product) {
    const response = await api.put(`/product/${id}`, product);
    return response.data;
}

export async function deleteProduct(id) {
    const response = await api.delete(`/product/${id}`);
    return response.data;
}