export default function StatCard({
  title,
  value,
  icon,
  color = "bg-blue-600",
  prefix = "",
  suffix = "",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition duration-300">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>

          <h2 className="text-3xl font-bold mt-2">
            {prefix}
            {Number(value).toLocaleString()}
            {suffix}
          </h2>
        </div>

        <div
          className={`${color} w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}