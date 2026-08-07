import { FaPowerOff} from "react-icons/fa";
import { FaBell, FaSearch,FaComments } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import NotificationBell from "../communication/NotificationBell";
import MessageDrawer from "../admin/MessageDrawer";
import useAuth from "../../hooks/useAuth";

export default function AdminHeader() {

   
    const [showMessages, setShowMessages] = useState(false);
      const { user, logout } = useAuth();



   return (
    <>
        <header className="bg-white shadow px-8 py-5 flex justify-between items-center">

            <div className="relative">
                <FaSearch className="absolute left-4 top-4 text-gray-400" />

                <input
                    className="border rounded-xl pl-12 py-3 w-96"
                    placeholder="Search..."
                />
            </div>

            <div className="flex items-center gap-5">

                <NotificationBell />

                <button
                    onClick={() => setShowMessages(true)}
                    className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                    <FaComments className="text-xl" />
                </button>

                <div className="text-right">
                    <h2 className="font-bold">
                        Administrator
                    </h2>

                    <p className="text-gray-500">
                        BluePeak POS
                    </p>
                </div>
            </div>

            <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
                <FaPowerOff />
                Logout
            </button>

        </header>

        <MessageDrawer
            open={showMessages}
            onClose={() => setShowMessages(false)}
        />
  
  
    </>



)};