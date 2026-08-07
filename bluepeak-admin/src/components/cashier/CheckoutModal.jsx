import { useState } from "react";
import {
    FaMoneyBillWave,
    FaCreditCard,
    FaMobileAlt
} from "react-icons/fa";

export default function CheckoutModal({
    open,
    total,
    onClose,
    onComplete
}) {

    const [method, setMethod] = useState("Cash");
    const [amountPaid, setAmountPaid] = useState("");

    if (!open) return null;

    const paid = Number(amountPaid) || 0;
    const change = paid - total;

    return (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

            <div className="bg-white rounded-3xl w-[550px] p-8">

                <h2 className="text-3xl font-bold mb-6">
                    Checkout
                </h2>

                <div className="bg-blue-50 rounded-xl p-5 mb-6">

                    <p className="text-gray-500">
                        Amount Due
                    </p>

                    <h1 className="text-5xl font-bold text-blue-700">
                        ${total.toFixed(2)}
                    </h1>

                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">

    <button
        onClick={() => setMethod("Cash")}
        className={`rounded-xl p-4 ${
            method === "Cash"
                ? "bg-green-600 text-white"
                : "bg-gray-100"
        }`}
    >
        <FaMoneyBillWave className="mx-auto text-2xl mb-2" />
        Cash
    </button>

    <button
        onClick={() =>
            onComplete({
                method: "Card",
                amountPaid: total,
                change: 0
            })
        }
        className="rounded-xl p-4 bg-gray-100 hover:bg-blue-700 hover:text-white transition"
    >
        <FaCreditCard className="mx-auto text-2xl mb-2" />
        Card
    </button>

    <button
        onClick={() =>
            onComplete({
                method: "EcoCash",
                amountPaid: total,
                change: 0
            })
        }
        className="rounded-xl p-4 bg-gray-100 hover:bg-purple-700 hover:text-white transition"
    >
        <FaMobileAlt className="mx-auto text-2xl mb-2" />
        EcoCash
    </button>

</div>

                {method === "Cash" && (

                    <div className="mb-6">

                        <label className="font-semibold">

                            Amount Received

                        </label>

                        <input
                            type="number"
                            className="w-full border rounded-xl p-4 mt-2"
                            value={amountPaid}
                            onChange={(e)=>setAmountPaid(e.target.value)}
                        />

                    </div>

                )}

                <div className="bg-slate-100 rounded-xl p-5 mb-6">

                    <div className="flex justify-between">

                        <span>Total</span>

                        <strong>${total.toFixed(2)}</strong>

                    </div>

                    <div className="flex justify-between mt-2">

                        <span>Paid</span>

                        <strong>${paid.toFixed(2)}</strong>

                    </div>

                    <div className="flex justify-between mt-4 text-2xl font-bold">

                        <span>Change</span>

                        <span className="text-green-600">

                            ${change > 0 ? change.toFixed(2) : "0.00"}

                        </span>

                    </div>

                </div>

                <div className="flex justify-end gap-3">

    <button
        onClick={onClose}
        className="px-6 py-3 rounded-xl bg-gray-300"
    >
        Cancel
    </button>

    {method === "Cash" && (
        <button
            disabled={paid < total}
            onClick={() =>
                onComplete({
                    method: "Cash",
                    amountPaid: paid,
                    change
                })
            }
            className="px-8 py-3 rounded-xl bg-green-700 text-white disabled:bg-gray-400"
        >
            Finish Cash Sale
        </button>
    )}

</div>

            </div>

        </div>

    );

}