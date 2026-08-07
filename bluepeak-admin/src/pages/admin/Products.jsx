import { useEffect, useState } from "react";
import AddProductModal from "../../components/admin/AddProductModal";
import {
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaBoxes
} from "react-icons/fa";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "../../services/productService";
import AdminLayout from "../../components/admin/AdminLayout";

export default function Products() {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error("Error loading products:", err);
            alert("Failed to load products. Please try again.");
        } finally {
            setLoading(false);
        }
    }

  async function saveProduct(formData) {

    try {

        if (editing) {

            await updateProduct(editing.productId, formData);

        } else {

            await createProduct(formData);

        }

        setOpen(false);
        setEditing(null);
        loadProducts();

    } catch (err) {

        console.log(err.response?.data);

        alert(JSON.stringify(err.response?.data?.errors, null, 2));

    }
}


    async function handleDelete(product) {
        if (!window.confirm(`Delete ${product.productName}?`)) return;
        try {
            await deleteProduct(product.productId);
            loadProducts();
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Failed to delete product. Please try again.");
        }
    }

    const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Products</h1>
                    <p className="text-gray-500">Manage your inventory</p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setOpen(true);
                    }}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-colors"
                >
                    <FaPlus />
                    Add Product
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow">
                <div className="p-5 border-b">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-4 text-gray-400" />
                        <input
                            placeholder="Search products..."
                            className="border rounded-xl pl-12 py-3 w-96 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
                        Loading products...
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="p-4 text-left">Code</th>
                                        <th className="p-4 text-left">Name</th>
                                        <th className="p-4 text-left">Price</th>
                                        <th className="p-4 text-left">Cost</th>
                                        <th className="p-4 text-left">Stock</th>
                                        <th className="p-4 text-left">Status</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((product) => (
                                        <tr
                                            key={product.productId}
                                            className="border-b hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="p-4">{product.productCode}</td>
                                            <td className="p-4">{product.productName}</td>
                                            <td className="p-4 font-medium">
                                                ${product.sellingPrice.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                ${product.costPrice.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-sm ${
                                                    product.quantityInStock <= 5 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {product.quantityInStock}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-sm ${
                                                    product.isActive 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {product.isActive ? "Active" : "Disabled"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-3 justify-center">
                                                    <button
                                                        onClick={() => {
                                                            setEditing(product);
                                                            setOpen(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                        aria-label="Edit product"
                                                    >
                                                        <FaEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product)}
                                                        className="text-red-500 hover:text-red-700 transition-colors"
                                                        aria-label="Delete product"
                                                    >
                                                        <FaTrash size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <FaBoxes className="text-5xl mx-auto mb-4 text-gray-300" />
                                <p className="text-lg">No Products Found</p>
                                <p className="text-sm mt-1">
                                    {search ? "Try adjusting your search" : "Add your first product to get started"}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AddProductModal
                open={open}
                product={editing}
                onClose={() => {
                    setOpen(false);
                    setEditing(null);
                }}
                onSave={saveProduct}
            />
        </AdminLayout>
    );
}