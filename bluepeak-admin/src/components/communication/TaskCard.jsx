export default function TaskCard({ task }) {

    return (

        <div className="bg-white rounded-xl shadow p-5 border">

            <div className="flex justify-between">

                <div>

                    <h2 className="font-bold text-lg">
                        {task.title}
                    </h2>

                    <p className="text-gray-500">
                        Assigned by {task.assignedBy}
                    </p>

                </div>

                <span className="bg-red-500 text-white px-3 py-1 rounded-full">
                    {task.priority}
                </span>

            </div>

            <div className="mt-4 flex justify-between">

                <span>{task.status}</span>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Open
                </button>

            </div>

        </div>

    );

}