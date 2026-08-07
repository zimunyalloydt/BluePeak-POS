import { useState } from "react";
import { FaTimes, FaUndoAlt } from "react-icons/fa";

const reasons = [
    "Wrong Item Scanned",
    "Damaged Product",
    "Customer Changed Mind",
    "Pricing Error",
    "Expired Product",
    "Duplicate Scan",
    "Other"
];

export default function RefundRequestModal({
    open,
    sale,
    onClose,
    onSubmit
}) {

    const [reason, setReason] = useState(reasons[0]);
    const [notes, setNotes] = useState("");

    if (!open || !sale) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

            <div className="bg-white rounded-3xl w-[650px] overflow-hidden">

                {/* Header */}

                <div className="flex justify-between items-center p-6 border-b">

                    <div>

                        <h2 className="text-3xl font-bold">
                            Refund Request
                        </h2>

                        <p className="text-gray-500">
                            Receipt #{sale.saleId}
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 text-2xl"
                    >
                        <FaTimes />
                    </button>

                </div>

                {/* Body */}

                <div className="p-6 space-y-6">

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">

                        <h3 className="font-bold text-orange-700">
                            Refund Summary
                        </h3>

                        <div className="grid grid-cols-2 gap-5 mt-4">

                            <div>

                                <p className="text-gray-500">
                                    Receipt
                                </p>

                                <strong>
                                    #{sale.saleId}
                                </strong>

                            </div>

                            <div>

                                <p className="text-gray-500">
                                    Total Sale
                                </p>

                                <strong>
                                    ${sale.total.toFixed(2)}
                                </strong>

                            </div>

                            <div>

                                <p className="text-gray-500">
                                    Payment
                                </p>

                                <strong>
                                    {sale.paymentMethod}
                                </strong>

                            </div>

                            <div>

                                <p className="text-gray-500">
                                    Cashier
                                </p>

                                <strong>
                                    {sale.cashier}
                                </strong>

                            </div>

                        </div>

                    </div>

                    <div>

                        <label className="font-semibold">

                            Refund Reason

                        </label>

                        <select
                            value={reason}
                            onChange={(e)=>setReason(e.target.value)}
                            className="w-full mt-2 border rounded-xl p-4"
                        >

                            {reasons.map(r => (

                                <option
                                    key={r}
                                    value={r}
                                >
                                    {r}
                                </option>

                            ))}

                        </select>

                    </div>

                    <div>

                        <label className="font-semibold">

                            Additional Notes

                        </label>

                        <textarea
                            rows={5}
                            className="w-full border rounded-xl mt-2 p-4 resize-none"
                            placeholder="Explain why the refund is being requested..."
                            value={notes}
                            onChange={(e)=>setNotes(e.target.value)}
                        />

                    </div>

                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">

                        <strong className="text-yellow-700">

                            Administrator Approval Required

                        </strong>

                        <p className="text-sm mt-2 text-gray-600">

                            This refund will not be processed immediately.
                            An administrator must approve the request before
                            the customer can be refunded.

                        </p>

                    </div>

                </div>

                {/* Footer */}

                <div className="border-t p-6 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl bg-gray-300 hover:bg-gray-400"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={() =>
                            onSubmit({
                                saleId: sale.saleId,
                                reason,
                                notes
                            })
                        }
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl flex items-center gap-2"
                    >
                        <FaUndoAlt />
                        Submit Refund Request
                    </button>

                </div>

            </div>

        </div>

    );

}