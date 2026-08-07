import { useState } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import TaskList from "../components/communication/TaskList";
import Messages from "../components/communication/Messages";

export default function TasksMessages() {
    const [tab, setTab] = useState("tasks");

    return (
        <AdminLayout>
            <div className="p-6">

                <h1 className="text-3xl font-bold mb-6">
                    Tasks & Messages
                </h1>

                <div className="flex gap-4 mb-6">

                    <button
                        onClick={() => setTab("tasks")}
                        className={`px-5 py-2 rounded-lg ${
                            tab === "tasks"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Tasks
                    </button>

                    <button
                        onClick={() => setTab("messages")}
                        className={`px-5 py-2 rounded-lg ${
                            tab === "messages"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200"
                        }`}
                    >
                        Messages
                    </button>

                </div>

                {tab === "tasks" && <TaskList />}

                {tab === "messages" && <Messages />}

            </div>
        </AdminLayout>
    );
}