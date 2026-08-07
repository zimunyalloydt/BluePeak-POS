import { useEffect, useRef, useState } from "react";

export default function QuantityModal({
    open,
    product,
    onCancel,
    onConfirm
}) {
    const [qty, setQty] = useState(1);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        setQty(1);

        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 50);
    }, [open, product]);

    if (!open || !product) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-80 p-6">

                <h2 className="text-xl font-bold">
                    {product.productName}
                </h2>

                <p className="text-gray-500 mt-1">
                    Enter Quantity
                </p>

                <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) =>
                        setQty(Math.max(1, Number(e.target.value)))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onConfirm(qty);
                        }
                    }}
                    className="mt-5 w-full border rounded-lg text-center text-3xl py-3 font-bold"
                />

                <div className="flex gap-3 mt-6">

                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-lg bg-gray-200"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() => onConfirm(qty)}
                        className="flex-1 py-3 rounded-lg bg-blue-700 text-white"
                    >
                        Add
                    </button>

                </div>

            </div>
        </div>
    );
}