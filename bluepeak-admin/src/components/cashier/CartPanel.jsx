import { useEffect, useRef } from "react";

import {
    FaPlus,
    FaMinus,
    FaTrash,
    FaMoneyBillWave,
    FaCreditCard,
    FaMobileAlt
} from "react-icons/fa";


export default function CartPanel({
    cart,
    increaseQty,
    decreaseQty,
    updateQty,
    removeItem,
    onCheckout,
    customerName,
    lastAddedProductId,
    setCustomerName
}) {

    const inputRefs = useRef({});

    useEffect(() => {
        if (!lastAddedProductId) return;

        const input = inputRefs.current[lastAddedProductId];

        if (input) {
            input.focus();
            input.select();
        }
    }, [lastAddedProductId, cart]);

    const subtotal = cart.reduce((sum, item) => {
        const price = Number(item.sellingPrice ?? item.price ?? 0);
        const qty = Number(item.qty ?? 0);

        return sum + qty * price;
    }, 0);

    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    return (
        <div className="w-96 bg-white border-l flex flex-col h-full">
            {/* Header */}
            <div className="p-5 border-b">
                <h2 className="text-2xl font-bold">
                    Current Sale
                </h2>
                <input
    type="text"
    placeholder="Customer Name (Optional)"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    className="mt-3 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        <p>No items in cart</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div
                            key={item.productId}
                            className="bg-slate-50 rounded-xl p-4 border hover:shadow-sm transition-shadow"
                        >
                            <div className="flex justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        {item.productName}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                       ${Number(item.sellingPrice ?? item.price ?? 0).toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeItem(item.productId)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    aria-label="Remove item"
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                               <div className="flex items-center gap-2 mt-3">

    <button
        onClick={() => decreaseQty(item.productId)}
        className="w-9 h-9 rounded-lg bg-gray-200 hover:bg-gray-300"
    >
        -
    </button>

    <input
    ref={(el) => {
        if (el) {
            inputRefs.current[item.productId] = el;
        }
    }}
    type="number"
    min="1"
    value={item.qty}
    onFocus={(e) => e.target.select()}
    onChange={(e) =>
        updateQty(
            item.productId,
            Number(e.target.value)
        )
    }
    className="w-16 border rounded-lg text-center py-2 font-bold"
/>

    <button
        onClick={() => increaseQty(item.productId)}
        className="w-9 h-9 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
    >
        +
    </button>

</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Totals */}
            <div className="border-t p-5 bg-gray-50">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">VAT (15%)</span>
                    <span className="font-medium">${vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span className="text-blue-700">${total.toFixed(2)}</span>
                </div>
            </div>

            {/* Payment Buttons */}
            <div className="p-5 border-t bg-white">
                <div className="grid grid-cols-2 gap-3">
                   
                <button
    onClick={() => onCheckout("Cash")}
    className="px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
>
    <FaMoneyBillWave className="inline mr-2" />
    Cash
</button>

<button
    onClick={() => onCheckout("Card")}
    className="px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
>
    <FaCreditCard className="inline mr-2" />
    Card
</button>

<button
    onClick={() => onCheckout("EcoCash")}
    className="col-span-2 px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
>
    <FaMobileAlt className="inline mr-2" />
    EcoCash
</button>
                   
                </div>
            </div>
        </div>
    );
}