import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

import { getProducts } from "../../services/productService";
import ProductCard from "./ProductCard";

export default function ProductGrid({ onAdd }) {

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {

        loadProducts();

    }, []);

    async function loadProducts() {
    try {
        const data = await getProducts();

        console.log("Products from API:", data);

        setProducts(data);

    } catch (err) {
        console.log("Error loading products:", err);

        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", err.response.data);
        }
    }
}

    const filtered = products.filter(x =>
        x.productName.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <div className="flex-1 bg-slate-100">

            <div className="bg-white p-5 border-b">

                <div className="relative">

                    <FaSearch className="absolute left-4 top-4 text-gray-400"/>

                    <input
                        className="w-full border rounded-xl pl-12 py-3"
                        placeholder="Search Product..."
                        value={search}
                        onChange={(e)=>setSearch(e.target.value)}
                    />

                </div>

            </div>

            <div className="p-6 grid grid-cols-4 gap-5 overflow-auto">

                {filtered.map(product => (

                    <ProductCard
                        key={product.productId}
                        product={product}
                        onAdd={onAdd}
                    />

                ))}

            </div>

        </div>

    );

}