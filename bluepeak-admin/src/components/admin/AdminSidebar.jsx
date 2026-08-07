import {
    FaTachometerAlt,
    FaBoxOpen,
    FaCashRegister,
    FaChartLine,
    FaUsers,
    FaTasks,
    FaChartBar,
    FaCog
} from "react-icons/fa";

import { NavLink } from "react-router-dom";
import { hasPermission } from "../../utils/permissions";
import { useAuth } from "../../context/AuthContext";

const menu = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: FaTachometerAlt,
        permission: null
    },
    {
        name: "Products",
        path: "/admin/products",
        icon: FaBoxOpen,
        permission: "Manage Products"
    },
    {
        name: "Sales",
        path: "/admin/sales",
        icon: FaCashRegister,
        permission: "Sell Products"
    },
    {
        name: "Profit",
        path: "/admin/profit",
        icon: FaChartLine,
        permission: "View Profit"
    },
    {
        name: "Users",
        path: "/admin/users",
        icon: FaUsers,
        permission: "Manage Users"
    },
   {
    name: "Tasks",
    icon: FaTasks,
    path: "/admin/tasks"
},
    {
        name: "Reports",
        path: "/admin/reports",
        icon: FaChartBar,
        permission: "View Reports"
    },
    {
        name: "Settings",
        path: "/admin/settings",
        icon: FaCog,
        permission: "Manage Settings"
    }
];

export default function AdminSidebar() {

    const { user } = useAuth();

    return (
        <aside className="w-72 bg-slate-900 text-white flex flex-col">

            <div className="p-6 border-b border-slate-700">
                <h1 className="text-3xl font-bold">
                    BluePeak
                </h1>

                <p className="text-slate-400">
                    Admin Panel
                </p>
            </div>

            <nav className="flex-1">

                {menu
                    .filter(item =>
                        item.permission === null ||
                        hasPermission(user, item.permission)
                    )
                    .map(item => {

                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 px-6 py-4 ${
                                        isActive
                                            ? "bg-blue-700"
                                            : "hover:bg-slate-800"
                                    }`
                                }
                            >
                                <Icon />
                                {item.name}
                            </NavLink>
                        );

                    })}

            </nav>

        </aside>
    );
}