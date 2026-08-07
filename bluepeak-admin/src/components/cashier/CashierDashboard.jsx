import CashierLayout from "../../components/cashier/CashierLayout";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";
export default function CashierDashboard() {
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    return (

        <CashierLayout>

            <div className="grid grid-cols-4 gap-6">

                <div className="bg-white rounded-2xl shadow p-6">

                    <p className="text-gray-500">
                        Today's Sales
                    </p>

                    <h1 className="text-4xl font-bold mt-3">
                        $0.00
                    </h1>

                </div>

                <div className="bg-white rounded-2xl shadow p-6">

                    <p className="text-gray-500">
                        Transactions
                    </p>

                    <h1 className="text-4xl font-bold mt-3">
                        0
                    </h1>

                </div>

                <div className="bg-white rounded-2xl shadow p-6">

                    <p className="text-gray-500">
                        Shift
                    </p>

                    <h1 className="text-2xl font-bold mt-3 text-green-600">
                        OPEN
                    </h1>

                </div>

                <div className="bg-white rounded-2xl shadow p-6">

                    <p className="text-gray-500">
                        Customers
                    </p>

                    <h1 className="text-4xl font-bold mt-3">
                        0
                    </h1>

                </div>

            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">

                <button
    onClick={() => navigate("/cashier/pos")}
    className="bg-blue-700 hover:bg-blue-800 text-white rounded-2xl p-12 text-2xl font-bold transition"
>
    🛒 Start New Sale
</button>

                <button className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-12 text-2xl font-bold">

                    👥 Customers

                </button>

                <button className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-12 text-2xl font-bold">

                    📄 Sales History

                </button>

                <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl p-12 text-2xl font-bold">

                    🔄 Returns

                </button>

                <button
    onClick={() =>
        showNotification({
            type: "task",
            title: "Count Drinks",
            message: "Count all soft drinks before closing.",
            priority: "High"
        })
    }
    className="bg-red-600 text-white rounded-xl p-6"
>
    Test Notification
</button>

            </div>

        </CashierLayout>

    );
}