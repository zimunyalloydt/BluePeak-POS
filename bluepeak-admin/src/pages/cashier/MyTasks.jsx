import { useEffect, useState } from "react";
import CashierLayout from "../../components/cashier/CashierLayout";
import { getMyTasks, completeTask } from "../../services/taskService";

export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {
        try {
            const data = await getMyTasks();
            setTasks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function finishTask(taskId) {
        try {
            await completeTask(taskId);
            await loadTasks();
        } catch (err) {
            console.error(err);
            alert("Failed to complete task.");
        }
    }

    return (
        <CashierLayout>

            <div className="max-w-5xl mx-auto p-6">

                <h1 className="text-3xl font-bold mb-6">
                    My Tasks
                </h1>

                {loading && (
                    <p>Loading tasks...</p>
                )}

                {!loading && tasks.length === 0 && (
                    <div className="bg-white rounded-xl shadow p-10 text-center">
                        No tasks assigned.
                    </div>
                )}

                <div className="grid gap-5">

                    {tasks.map(task => (

                        <div
                            key={task.taskItemId}
                            className="bg-white rounded-xl shadow p-6"
                        >

                            <div className="flex justify-between items-start">

                                <div>

                                    <h2 className="text-xl font-bold">
                                        {task.title}
                                    </h2>

                                    <p className="text-gray-600 mt-2">
                                        {task.description}
                                    </p>

                                </div>

                                <span
                                    className={`px-3 py-1 rounded-full text-sm
                                    ${
                                        task.priority === "High"
                                            ? "bg-red-100 text-red-700"
                                            : task.priority === "Normal"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-green-100 text-green-700"
                                    }`}
                                >
                                    {task.priority}
                                </span>

                            </div>

                            <div className="mt-5 flex justify-between items-center">

                                <div>

                                    <div className="text-sm text-gray-500">
                                        Due Date
                                    </div>

                                    <div>
                                        {task.dueDate
                                            ? new Date(task.dueDate).toLocaleDateString()
                                            : "No due date"}
                                    </div>

                                </div>

                                {task.status === "Completed" ? (

                                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full">
                                        ✔ Completed
                                    </span>

                                ) : (

                                    <button
                                        onClick={() => finishTask(task.taskItemId)}
                                        className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
                                    >
                                        Complete Task
                                    </button>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </CashierLayout>
    );
}