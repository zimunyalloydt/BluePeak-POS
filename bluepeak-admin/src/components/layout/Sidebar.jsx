import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  FaChartPie,
  FaBoxOpen,
  FaWarehouse,
  FaShoppingCart,
  FaUsers,
  FaTruck,
  FaFileAlt,
  FaCog,
} from "react-icons/fa";

const menu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    roles: ["Admin", "Manager"],
  },
  {
    name: "Products",
    path: "/products",
    roles: ["Admin", "Manager"],
  },
  {
    name: "Inventory",
    path: "/inventory",
    roles: ["Admin", "Manager"],
  },
  {
    name: "Sales",
    path: "/sales",
    roles: ["Admin", "Manager"],
  },
  {
    name: "Customers",
    path: "/customers",
    roles: ["Admin", "Manager", "Cashier"],
  },
  {
    name: "Suppliers",
    path: "/suppliers",
    roles: ["Admin"],
  },
  {
    name: "Reports",
    path: "/reports",
    roles: ["Admin", "Manager"],
  },
  {
    name: "Settings",
    path: "/settings",
    roles: ["Admin"],
  },
];

    

export default function Sidebar() {
  const { user } = useAuth();
  const visibleMenu = menu.filter(item =>
    item.roles.includes(user?.role)
);
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
      <div className="h-20 flex items-center justify-center border-b border-slate-700">
        <h1 className="text-2xl font-bold tracking-wide text-blue-400">
          BluePeak POS
        </h1>
      </div>

      <nav className="flex-1 py-6">
        {visibleMenu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-5 border-t border-slate-700 text-sm text-slate-400">
        © 2026 BluePeak
      </div>
    </aside>
  );
}