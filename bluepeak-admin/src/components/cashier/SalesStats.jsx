export default function SalesStats() {

    const stats = [

        {
            title: "Today's Sales",
            value: "$1,245.60"
        },

        {
            title: "Transactions",
            value: "38"
        },

        {
            title: "Pending Refunds",
            value: "2"
        },

        {
            title: "Approved Refunds",
            value: "1"
        }

    ];

    return (

        <div className="grid grid-cols-4 gap-6">

            {stats.map((stat) => (

                <div
                    key={stat.title}
                    className="bg-white rounded-2xl shadow p-6"
                >

                    <p className="text-gray-500">
                        {stat.title}
                    </p>

                    <h2 className="text-3xl font-bold mt-3 text-blue-700">
                        {stat.value}
                    </h2>

                </div>

            ))}

        </div>

    );

}