import {
    FaPrint,
    FaUndoAlt,
    FaTimes
} from "react-icons/fa";

export default function ReceiptModal({
    open,
    sale,
    onClose,
    onRefund
}) {

    if (!open || !sale) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

            <div className="bg-white rounded-3xl w-[700px] max-h-[90vh] overflow-auto">

                {/* Header */}

                <div className="flex justify-between items-center p-6 border-b">

                    <div>

                        <h2 className="text-3xl font-bold">

                            Receipt #{sale.saleId}

                        </h2>

                        <p className="text-gray-500">

                            {sale.saleDate}

                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="text-2xl text-gray-500 hover:text-red-600"
                    >
                        <FaTimes />
                    </button>

                </div>

                {/* Receipt Info */}

                <div className="p-6 grid grid-cols-2 gap-6">

                    <div>

                        <p className="text-gray-500">
                            Cashier
                        </p>

                        <h3 className="font-bold">
                            {sale.cashier}
                        </h3>

                    </div>

                    <div>

                        <p className="text-gray-500">
                            Payment
                        </p>

                        <h3 className="font-bold">
                            {sale.paymentMethod}
                        </h3>

                    </div>

                    <div>

                        <p className="text-gray-500">
                            Receipt
                        </p>

                        <h3 className="font-bold">
                            #{sale.saleId}
                        </h3>

                    </div>

                    <div>

                        <p className="text-gray-500">
                            Status
                        </p>

                        <h3 className="font-bold text-green-600">
                            {sale.status}
                        </h3>

                    </div>

                </div>

                {/* Items */}

                <div className="px-6">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b">

                                <th className="py-3 text-left">
                                    Product
                                </th>

                                <th className="text-center">
                                    Qty
                                </th>

                                <th className="text-right">
                                    Price
                                </th>

                                <th className="text-right">
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {sale.items.map(item => (

                                <tr key={item.productId}>

                                    <td className="py-4">

                                        {item.productName}

                                    </td>

                                    <td className="text-center">

                                        {item.quantity}

                                    </td>

                                    <td className="text-right">

                                        ${item.unitPrice.toFixed(2)}

                                    </td>

                                    <td className="text-right font-bold">

                                        ${item.total.toFixed(2)}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                {/* Totals */}

                <div className="p-6">

                    <div className="flex justify-end">

                        <div className="w-72">

                            <div className="flex justify-between">

                                <span>Subtotal</span>

                                <strong>

                                    ${sale.subtotal.toFixed(2)}

                                </strong>

                            </div>

                            <div className="flex justify-between mt-2">

                                <span>VAT</span>

                                <strong>

                                    ${sale.vat.toFixed(2)}

                                </strong>

                            </div>

                            <div className="flex justify-between mt-4 text-2xl font-bold border-t pt-3">

                                <span>Total</span>

                                <span>

                                    ${sale.total.toFixed(2)}

                                </span>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Buttons */}

                <div className="border-t p-6 flex justify-end gap-3">

                    <button
                        className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-3 flex items-center gap-2"
                    >
                        <FaPrint />
                        Print
                    </button>

                    {sale.status === "Completed" && (

                        <button
                            onClick={() => onRefund(sale)}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 flex items-center gap-2"
                        >
                            <FaUndoAlt />
                            Request Refund
                        </button>

                    )}

                </div>

            </div>

        </div>

    );

}