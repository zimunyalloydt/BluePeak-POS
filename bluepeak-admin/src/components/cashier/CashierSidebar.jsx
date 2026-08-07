import {
    FaCashRegister,
    FaChartLine,
    FaExchangeAlt,
    FaUserFriends,
    FaShoppingBasket,
    FaUserShield,
    FaTasks,
    FaCog
} from "react-icons/fa";

import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function CashierSidebar() {

    const { user } = useAuth();

    const menu = [
        {
            title: "POS",
            icon: <FaCashRegister />,
            path: "/cashier/pos",
            roles: ["Cashier", "Manager", "Admin"]
        },
        {
            title: "Customers",
            icon: <FaUserFriends />,
            path: "/cashier/customers",
            roles: ["Cashier", "Manager", "Admin"]
        },

  {
    title: "My Tasks",
    path: "/cashier/tasks",
    icon: <FaTasks />,
    roles: ["Cashier", "Manager", "Admin"]
},

        {
            title: "My Sales",
            icon: <FaChartLine />,
            path: "/cashier/sales",
            roles: ["Cashier", "Manager", "Admin"]
        },
        {
            title: "Returns",
            icon: <FaExchangeAlt />,
            path: "/cashier/returns",
            roles: ["Manager", "Admin"]
        },
        {
            title: "Inventory",
            icon: <FaShoppingBasket />,
            path: "/inventory",
            roles: ["Manager", "Admin"]
        },
        {
            title: "Users",
            icon: <FaUserShield />,
            path: "/users",
            roles: ["Admin"]
        },
        {
            title: "Settings",
            icon: <FaCog />,
            path: "/settings",
            roles: ["Admin"]
        }
    ];

    const visibleMenu = menu.filter(item =>
        item.roles.includes(user?.role)
    );

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col">

            {/* Header */}

            <div className="p-6 border-b border-slate-700">

                <h2 className="text-xl font-bold">
                    Cashier Panel
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                    {user?.role}
                </p>

            </div>

            {/* Navigation */}

            <div className="flex-1 p-4">

                {visibleMenu.map(item => (

                    <NavLink
                        key={item.title}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl mb-2 transition ${
                                isActive
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-slate-800 text-slate-200"
                            }`
                        }
                    >
                        <span className="text-lg">
                            {item.icon}
                        </span>

                        <span>
                            {item.title}
                        </span>

                    </NavLink>

                ))}

            </div>

            {/* Footer */}

            <div className="p-5 border-t border-slate-700">

                <div className="bg-slate-800 rounded-xl p-4">

                    <p className="text-sm text-slate-400">
                        Logged in as
                    </p>

                    <h3 className="font-semibold mt-1">
                        {user?.fullName}
                    </h3>

                </div>

            </div>

        </aside>
    );
}