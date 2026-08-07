import {
    FaEye,
    FaUndoAlt
} from "react-icons/fa";

export default function SalesTable({
    sales = [],
    onView,
    onRefund
}) {

    return (

        <div className="bg-white rounded-2xl shadow overflow-hidden">

            <table className="w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="p-4 text-left">Receipt</th>
                        <th className="p-4 text-left">Time</th>
                        <th className="p-4 text-left">Items</th>
                        <th className="p-4 text-left">Payment</th>
                        <th className="p-4 text-left">Total</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-center">Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {sales.length === 0 ? (

                        <tr>

                            <td
                                colSpan="7"
                                className="text-center py-10 text-gray-500"
                            >
                                No sales found.
                            </td>

                        </tr>

                    ) : (

                        sales.map((sale) => (

                            <tr
                                key={sale.saleId}
                                className="border-t hover:bg-slate-50 transition"
                            >

                                <td className="p-4 font-semibold">
                                    #{sale.saleId}
                                </td>

                                <td className="p-4">
                                    {sale.saleTime ?? sale.time}
                                </td>

                                <td className="p-4">
                                    {sale.items?.length ?? sale.itemCount ?? 0}
                                </td>

                                <td className="p-4">
                                    {sale.paymentMethod}
                                </td>

                                <td className="p-4 font-bold text-blue-700">
                                    ${Number(sale.total).toFixed(2)}
                                </td>

                                <td className="p-4">

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold
                                        ${
                                            sale.status === "Completed"
                                                ? "bg-green-100 text-green-700"
                                                : sale.status === "Pending Approval"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : sale.status === "Approved"
                                                ? "bg-blue-100 text-blue-700"
                                                : sale.status === "Rejected"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                        {sale.status}
                                    </span>

                                </td>

                                <td className="p-4">

                                    <div className="flex justify-center gap-2">

                                        <button
                                            onClick={() => onView(sale)}
                                            className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-700 hover:text-white transition"
                                            title="View Receipt"
                                        >
                                            <FaEye className="mx-auto" />
                                        </button>

                                        {sale.status === "Completed" && (

                                            <button
                                                onClick={() => onRefund(sale)}
                                                className="w-10 h-10 rounded-full bg-orange-100 hover:bg-orange-600 hover:text-white transition"
                                                title="Request Refund"
                                            >
                                                <FaUndoAlt className="mx-auto" />
                                            </button>

                                        )}

                                    </div>

                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>

    );

}