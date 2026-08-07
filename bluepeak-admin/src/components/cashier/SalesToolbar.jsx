import { FaSearch, FaCalendarAlt, FaSyncAlt } from "react-icons/fa";

export default function SalesToolbar() {

    return (

        <div className="bg-white rounded-2xl shadow p-5">

            <div className="grid grid-cols-5 gap-4">

                <div className="relative col-span-2">

                    <FaSearch className="absolute left-4 top-4 text-gray-400"/>

                    <input
                        placeholder="Search receipt, product..."
                        className="w-full border rounded-xl pl-12 py-3"
                    />

                </div>

                <div className="relative">

                    <FaCalendarAlt className="absolute left-4 top-4 text-gray-400"/>

                    <input
                        type="date"
                        className="w-full border rounded-xl pl-12 py-3"
                    />

                </div>

                <div className="relative">

                    <FaCalendarAlt className="absolute left-4 top-4 text-gray-400"/>

                    <input
                        type="date"
                        className="w-full border rounded-xl pl-12 py-3"
                    />

                </div>

                <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl flex justify-center items-center gap-2">

                    <FaSyncAlt />

                    Refresh

                </button>

            </div>

        </div>

    );

}