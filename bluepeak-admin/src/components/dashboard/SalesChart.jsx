import {
    LineChart,
    Line,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const data = [
    { day: "Mon", sales: 320 },
    { day: "Tue", sales: 520 },
    { day: "Wed", sales: 410 },
    { day: "Thu", sales: 710 },
    { day: "Fri", sales: 890 },
    { day: "Sat", sales: 1100 },
    { day: "Sun", sales: 980 },
];

export default function SalesChart() {
    return (
        <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-5">
                Weekly Sales
            </h2>

            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="day" />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#2563eb"
                        strokeWidth={4}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}