import { FaShoppingCart } from "react-icons/fa";

export default function ProductCard({ product, onAdd }) {
    const stock = product.quantityInStock ?? product.stock ?? 0;
    const name = product.productName ?? product.name ?? "Product";
    const price = product.sellingPrice ?? product.price ?? 0;
    const image = product.imageUrl || "/images/no-image.png";

    const stockColor =
        stock <= 5
            ? "text-red-500"
            : stock <= 20
            ? "text-yellow-500"
            : "text-green-600";

    return (
        <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden">

            <div className="h-40 bg-slate-100 flex items-center justify-center">
               <img
    src={
        product.imageUrl
            ? `http://localhost:5160${product.imageUrl}`
            : "/images/no-image.png"
    }
    alt={product.productName}
    className="w-full h-40 object-cover rounded-lg"
/>
            </div>

            <div className="p-4">

                <h2 className="font-bold text-lg truncate">
                    {name}
                </h2>

                <div className="flex justify-between mt-3">

                    <span className="text-blue-700 font-bold">
                        ${Number(price).toFixed(2)}
                    </span>

                    <span className={stockColor}>
                        Stock: {stock}
                    </span>

                </div>

                <button
                    onClick={() => onAdd(product)}
                    className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-3 flex justify-center items-center gap-2"
                >
                    <FaShoppingCart />
                    Add to Cart
                </button>

            </div>

        </div>
    );
}