import { useEffect, useState } from "react";
import {
    FaDollarSign,
    FaChartLine,
    FaShoppingCart,
    FaReceipt
} from "react-icons/fa";

import AdminLayout from "../../components/admin/AdminLayout";
import { getDashboard } from "../../services/adminService";

export default function Dashboard() {

    const [stats, setStats] = useState({
        todaySales: 0,
        todayProfit: 0,
        transactions: 0,
        averageSale: 0
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const data = await getDashboard();
            setStats(data);
        }
        catch (err) {
            console.log(err);
        }
    }

    return (
        <AdminLayout>

            <h1 className="text-4xl font-bold mb-8">
                Dashboard
            </h1>

            <div className="grid grid-cols-4 gap-6">

                <StatCard
                    title="Today's Sales"
                    value={`$${stats.todaySales.toFixed(2)}`}
                    icon={<FaDollarSign />}
                    color="bg-blue-700"
                />

                <StatCard
                    title="Today's Profit"
                    value={`$${stats.todayProfit.toFixed(2)}`}
                    icon={<FaChartLine />}
                    color="bg-green-600"
                />

                <StatCard
                    title="Transactions"
                    value={stats.transactions}
                    icon={<FaShoppingCart />}
                    color="bg-purple-600"
                />

                <StatCard
                    title="Average Sale"
                    value={`$${stats.averageSale.toFixed(2)}`}
                    icon={<FaReceipt />}
                    color="bg-orange-600"
                />

            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">

                <div className="col-span-2 bg-white rounded-2xl shadow p-6">

                    <h2 className="text-2xl font-bold mb-5">
                        Revenue Overview
                    </h2>

                    <div className="h-[350px] flex justify-center items-center text-gray-400">

                        Sales chart coming next...

                    </div>

                </div>

                <div className="bg-white rounded-2xl shadow p-6">

                    <h2 className="text-2xl font-bold mb-5">

                        Top Products

                    </h2>

                    <div className="text-gray-400">

                        Coming next...

                    </div>

                </div>

            </div>

        </AdminLayout>
    );

}

function StatCard({
    title,
    value,
    icon,
    color
}) {

    return (

        <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex justify-between">

                <div>

                    <p className="text-gray-500">

                        {title}

                    </p>

                    <h1 className="text-4xl font-bold mt-2">

                        {value}

                    </h1>

                </div>

                <div className={`${color} w-16 h-16 rounded-2xl text-white flex items-center justify-center text-2xl`}>

                    {icon}

                </div>

            </div>

        </div>

    );

}