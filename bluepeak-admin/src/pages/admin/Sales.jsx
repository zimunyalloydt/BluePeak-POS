import { useEffect, useMemo, useState } from "react";
import {
    FaSearch,
    FaReceipt,
    FaCalendarAlt,
    FaDollarSign,
    FaEye,
    FaChartLine,
} from "react-icons/fa";

import AdminLayout from "../../components/admin/AdminLayout";
import { getSales } from "../../services/adminSalesService";

function SummaryCard({ title, value, icon, color }) {
    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between">
                <div>
                    <p className="text-gray-500">{title}</p>
                    <h2 className="text-3xl font-bold mt-2">{value}</h2>
                </div>
                <div
                    className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function formatCurrency(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("today");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getSales();
                if (!cancelled) {
                    setSales(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!cancelled) console.error(err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const filteredSales = useMemo(() => {
        const today = new Date();

        return sales
            .filter((sale) => {
                const saleDate = new Date(sale.saleDate);

                switch (filter) {
                    case "today":
                        return (
                            saleDate.toDateString() ===
                            today.toDateString()
                        );
                    case "week": {
                        const days =
                            (today.getTime() - saleDate.getTime()) /
                            (1000 * 60 * 60 * 24);
                        return days >= 0 && days <= 7;
                    }
                    case "month":
                        return (
                            saleDate.getMonth() === today.getMonth() &&
                            saleDate.getFullYear() === today.getFullYear()
                        );
                    case "year":
                        return (
                            saleDate.getFullYear() === today.getFullYear()
                        );
                    default:
                        return true;
                }
            })
            .filter(
                (s) =>
                    s.saleId.toString().includes(search) ||
                    s.cashier.toLowerCase().includes(search.toLowerCase())
            );
    }, [sales, search, filter]);

    const summary = useMemo(() => {
        const revenue = filteredSales.reduce(
            (sum, sale) => sum + Number(sale.total || 0),
            0
        );
        const transactions = filteredSales.length;
        const averageSale =
            transactions === 0 ? 0 : revenue / transactions;

        return {
            revenue,
            transactions,
            averageSale,
        };
    }, [filteredSales]);

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Sales</h1>
                    <p className="text-gray-500">
                        Monitor all completed sales
                    </p>
                </div>
                <div className="flex gap-3">
                    {["today", "week", "month", "year"].map((value) => (
                        <button
                            key={value}
                            onClick={() => setFilter(value)}
                            className={`px-4 py-2 rounded-lg capitalize ${
                                filter === value
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-5 mb-8">
                <SummaryCard
                    title="Revenue"
                    value={formatCurrency(summary.revenue)}
                    icon={<FaChartLine />}
                    color="bg-blue-600"
                />
                <SummaryCard
                    title="Profit"
                    value="Coming Soon"
                    icon={<FaDollarSign />}
                    color="bg-green-600"
                />
                <SummaryCard
                    title="Transactions"
                    value={summary.transactions}
                    icon={<FaReceipt />}
                    color="bg-purple-700"
                />
                <SummaryCard
                    title="Average Sale"
                    value={formatCurrency(summary.averageSale)}
                    icon={<FaCalendarAlt />}
                    color="bg-orange-600"
                />
            </div>

            {/* Search + Table */}
            <div className="bg-white rounded-2xl shadow mb-6">
                <div className="p-5 border-b">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search receipt, cashier..."
                            className="border rounded-xl pl-12 py-3 w-96"
                        />
                    </div>
                </div>

                <table className="w-full">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-4 text-left">Receipt</th>
                            <th className="p-4 text-left">Date</th>
                            <th className="p-4 text-left">Cashier</th>
                            <th className="p-4 text-left">Items</th>
                            <th className="p-4 text-left">Payment</th>
                            <th className="p-4 text-left">Total</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-10">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredSales.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-10">
                                    No sales found.
                                </td>
                            </tr>
                        ) : (
                            filteredSales.map((sale) => (
                                <tr
                                    key={sale.saleId}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="p-4">#{sale.saleId}</td>
                                    <td className="p-4">
                                        {new Date(
                                            sale.saleDate
                                        ).toLocaleString()}
                                    </td>
                                    <td className="p-4">{sale.cashier}</td>
                                    <td className="p-4">{sale.items}</td>
                                    <td className="p-4">
                                        {sale.paymentMethod}
                                    </td>
                                    <td className="p-4 font-semibold">
                                        {formatCurrency(sale.total)}
                                    </td>
                                    <td className="text-center">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <FaEye />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}