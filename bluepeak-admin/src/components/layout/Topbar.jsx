import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

export default function Topbar() {
  return (
    <header className="bg-white shadow-sm h-20 flex items-center justify-between px-8">
      <div className="relative w-96">
        <FaSearch className="absolute left-4 top-3.5 text-gray-400" />

        <input
          type="text"
          placeholder="Search products, customers..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative">
          <FaBell className="text-2xl text-slate-600" />

          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center gap-3">
          <FaUserCircle className="text-4xl text-blue-600" />

          <div>
            <h3 className="font-semibold">Administrator</h3>
            <p className="text-sm text-gray-500">System Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}