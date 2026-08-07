import { useEffect, useState } from "react";

export default function AddProductModal({
    open,
    onClose,
    onSave,
    product
}) {
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState("");

    const [form, setForm] = useState({
        productCode: "",
        productName: "",
        barcode: "",
        sellingPrice: "",
        costPrice: "",
        quantityInStock: 0,
      
        isActive: true
    });

    useEffect(() => {
        if (product) {
            setForm({
                productCode: product.productCode ?? "",
                productName: product.productName ?? "",
                barcode: product.barcode ?? "",
                sellingPrice: product.sellingPrice ?? "",
                costPrice: product.costPrice ?? "",
                quantityInStock: product.quantityInStock ?? 0,
               
                isActive: product.isActive ?? true
            });

            setPreview(product.imageUrl || "");
            setImageFile(null);
        } else {
            setForm({
                productCode: "",
                productName: "",
                barcode: "",
                sellingPrice: "",
                costPrice: "",
                quantityInStock: 0,
             
                isActive: true
            });

            setPreview("");
            setImageFile(null);
        }
    }, [product, open]);

    if (!open) return null;

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    function handleImageChange(e) {
        const file = e.target.files[0];

        if (!file) return;

        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    }

    function submit() {
        const formData = new FormData();

        formData.append("ProductCode", form.productCode);
        formData.append("ProductName", form.productName);
        formData.append("Barcode", form.barcode || "");
        formData.append("SellingPrice", form.sellingPrice);
        formData.append("CostPrice", form.costPrice);
        formData.append("QuantityInStock", form.quantityInStock);
       
        formData.append("IsActive", form.isActive);

        if (imageFile) {
            formData.append("Image", imageFile);
        }

        console.log("Sending FormData");

        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        onSave(formData);
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl w-[700px] p-8">

                <h2 className="text-3xl font-bold mb-6">
                    {product ? "Edit Product" : "Add Product"}
                </h2>

                <div className="grid grid-cols-2 gap-5">

                    <div>
                        <label>Product Code</label>

                        <input
                            name="productCode"
                            value={form.productCode}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div>
                        <label>Barcode</label>

                        <input
                            name="barcode"
                            value={form.barcode}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div className="col-span-2">
                        <label>Product Name</label>

                        <input
                            name="productName"
                            value={form.productName}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div>
                        <label>Selling Price</label>

                        <input
                            type="number"
                            step="0.01"
                            name="sellingPrice"
                            value={form.sellingPrice}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div>
                        <label>Cost Price</label>

                        <input
                            type="number"
                            step="0.01"
                            name="costPrice"
                            value={form.costPrice}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div>
                        <label>Stock</label>

                        <input
                            type="number"
                            name="quantityInStock"
                            value={form.quantityInStock}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div>
                        

                        <input
                            type="number"
                           
                            
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3 mt-2"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block mb-2 font-medium">
                            Product Image
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full border rounded-lg p-2"
                        />

                        {preview && (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-40 h-40 object-cover rounded-xl border mt-4"
                            />
                        )}
                    </div>

                    <div className="col-span-2 flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                        />

                        <span>Active Product</span>
                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8">

                    <button
                        onClick={onClose}
                        className="bg-gray-300 px-6 py-3 rounded-xl"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={submit}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl"
                    >
                        Save Product
                    </button>

                </div>

            </div>
        </div>
    );
}