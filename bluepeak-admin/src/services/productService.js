import api from "./api";

export async function getProducts() {
    try {
        const response = await api.get("/Product");

        console.log("========== SERVER PRODUCTS ==========");
        console.log("Server product count:", response.data.length);
        console.log("Server products:", response.data);

        response.data.forEach((product) => {
    console.log("PRODUCT COST CHECK:", {
        productId: product.productId,
        productName: product.productName,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
    });
});

        if (!Array.isArray(response.data)) {
            throw new Error("Invalid products response from server.");
        }

        console.log("========== PRODUCT RETRIEVAL COMPLETE ==========");

        return response.data;

    } catch (error) {
        console.error(
            "========== PRODUCT FETCH FAILED ==========",
            error.response?.data || error
        );

        throw error;
    }
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