import { FaArrowUp } from "react-icons/fa";

export default function StatCard({
    title,
    value,
    icon,
    color = "bg-blue-600",
    growth = "+0%"
}) {

    const Icon = icon;

    return (

        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition p-6">

            <div className="flex justify-between">

                <div>

                    <p className="text-gray-500 text-sm">
                        {title}
                    </p>

                    <h1 className="text-4xl font-bold mt-3">
                        {value}
                    </h1>

                </div>

                <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl`}>

                    <Icon />

                </div>

            </div>

            <div className="flex items-center gap-2 mt-6 text-green-600">

                <FaArrowUp />

                <span className="font-semibold">
                    {growth}
                </span>

                <span className="text-gray-500">
                    vs yesterday
                </span>

            </div>

        </div>

    );

}