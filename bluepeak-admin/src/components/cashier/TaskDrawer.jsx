import { useEffect, useState } from "react";
import { getMyTasks, completeTask } from "../../services/taskService";

export default function TaskDrawer({
    open,
    onClose
}) {

    const [tasks, setTasks] = useState([]);

    async function loadTasks() {
        try {
            const data = await getMyTasks();
            console.log("MY TASKS:", data);
            setTasks(data);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if (open) {
            loadTasks();
        }
    }, [open]);

    useEffect(() => {

        function receive() {
            loadTasks();
        }

        window.addEventListener("bluepeak-task", receive);

        return () =>
            window.removeEventListener("bluepeak-task", receive);

    }, []);

    async function markComplete(taskId) {

        await completeTask(taskId);

        loadTasks();

    }

    return (
        <div
            className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transition-transform duration-300 ${
                open ? "translate-x-0" : "translate-x-full"
            }`}
        >
            <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-xl font-bold">My Tasks</h2>

                <button onClick={onClose}>✕</button>
            </div>

            <div className="overflow-y-auto h-full pb-24">

                {tasks.length === 0 && (

                    <div className="p-6 text-center text-gray-500">
                        No tasks assigned.
                    </div>

                )}

                {tasks.map(task => (

                    <div
                        key={task.taskItemId}
                        className="p-4 border-b"
                    >
                        <h3 className="font-semibold">
                            {task.title}
                        </h3>

                        <p className="text-gray-500">
                            {task.description}
                        </p>

                        <div className="mt-2 text-sm">
                            Priority: {task.priority}
                        </div>

                        <button
                            onClick={() => markComplete(task.taskItemId)}
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Mark Complete
                        </button>

                    </div>

                ))}

            </div>

        </div>
    );
}