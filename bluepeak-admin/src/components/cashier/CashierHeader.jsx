import { useEffect, useState } from "react";
import {
    FaBell,
    FaComments,
    FaClock,
    FaPowerOff,
    FaUserCircle,
    FaClipboardList,
    FaCashRegister
} from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import NotificationBell from "../communication/NotificationBell";

export default function CashierHeader({
    onOpenTasks,
    onOpenMessages,
    onOpenNotifications,
    taskCount,
    messageCount,
    //notificationCount
}) {
    const { user, logout } = useAuth();

    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <header className="bg-white shadow px-8 py-5 flex justify-between items-center">

            {/* Left */}
            <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center">
                    <FaCashRegister className="text-white text-xl" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        BluePeak POS
                    </h1>

                    <p className="text-sm text-gray-500">
                        Cashier Terminal
                    </p>
                </div>

            </div>

            {/* Center */}
            <div className="flex items-center gap-6">

                <div className="flex items-center gap-2 text-gray-600">
                    <FaClock />
                    <span className="font-semibold">
                        {time.toLocaleTimeString()}
                    </span>
                </div>

                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Shift Open
                </div>

            </div>

            {/* Right */}
            <div className="flex items-center gap-5">

                {/* Notifications */}
                <NotificationBell onClick={onOpenNotifications} />

                {/* Messages */}
                <button
                    onClick={onOpenMessages}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <FaComments className="text-xl text-gray-700" />

                    {messageCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {messageCount}
                        </span>
                    )}
                </button>

                {/* Tasks */}
                <button
                    onClick={onOpenTasks}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition text-gray-700"
                    title="Tasks"
                >
                    <FaClipboardList className="text-xl" />

                    {taskCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {taskCount}
                        </span>
                    )}
                </button>

                {/* User */}
                <div className="flex items-center gap-3">

                    <FaUserCircle className="text-4xl text-blue-700" />

                    <div>
                        <h3 className="font-semibold">
                            {user?.fullName}
                        </h3>

                        <p className="text-sm text-gray-500">
                            {user?.role}
                        </p>
                    </div>

                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
                >
                    <FaPowerOff />
                    Logout
                </button>

            </div>

        </header>
    );
}