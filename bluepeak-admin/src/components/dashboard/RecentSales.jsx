const sales = [
    {
        id: 1001,
        customer: "John Doe",
        amount: "$120",
        status: "Paid",
    },
    {
        id: 1002,
        customer: "Sarah Lee",
        amount: "$54",
        status: "Paid",
    },
    {
        id: 1003,
        customer: "Michael",
        amount: "$220",
        status: "Pending",
    },
    {
        id: 1004,
        customer: "Ashley",
        amount: "$74",
        status: "Paid",
    },
];

export default function RecentSales() {
    return (
        <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-5">
                Recent Sales
            </h2>

            <table className="w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-3">Invoice</th>
                        <th className="text-left">Customer</th>
                        <th className="text-left">Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    {sales.map((sale) => (
                        <tr
                            key={sale.id}
                            className="border-b hover:bg-gray-50"
                        >
                            <td className="py-3">#{sale.id}</td>

                            <td>{sale.customer}</td>

                            <td>{sale.amount}</td>

                            <td className="text-center">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${
                                        sale.status === "Paid"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }`}
                                >
                                    {sale.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}