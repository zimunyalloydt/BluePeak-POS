import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AssignTask() {
    const [users, setUsers] = useState([]);

    const [form, setForm] = useState({
        title: "",
        description: "",
        assignedUserId: "",
        priority: "Normal",
        dueDate: ""
    });

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const { data } = await api.get("/users");
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function submit(e) {
        e.preventDefault();

        try {
            await api.post("/tasks", form);

            alert("Task assigned successfully.");

            setForm({
                title: "",
                description: "",
                assignedUserId: "",
                priority: "Normal",
                dueDate: ""
            });

        } catch (err) {
            console.error(err);
            alert("Failed to assign task.");
        }
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">

            <h1 className="text-2xl font-bold mb-6">
                Assign Task
            </h1>

            <form onSubmit={submit} className="space-y-4">

                <input
                    className="w-full border rounded-lg p-3"
                    placeholder="Title"
                    value={form.title}
                    onChange={e =>
                        setForm({
                            ...form,
                            title: e.target.value
                        })
                    }
                />

                <textarea
                    className="w-full border rounded-lg p-3"
                    placeholder="Description"
                    rows={5}
                    value={form.description}
                    onChange={e =>
                        setForm({
                            ...form,
                            description: e.target.value
                        })
                    }
                />

                <select
                    className="w-full border rounded-lg p-3"
                    value={form.assignedUserId}
                    onChange={e =>
                        setForm({
                            ...form,
                            assignedUserId: e.target.value
                        })
                    }
                >
                    <option value="">
                        Select User
                    </option>

                    {users.map(user => (
                        <option
                            key={user.userId}
                            value={user.userId}
                        >
                            {user.firstName} {user.lastName}
                        </option>
                    ))}

                </select>

                <select
                    className="w-full border rounded-lg p-3"
                    value={form.priority}
                    onChange={e =>
                        setForm({
                            ...form,
                            priority: e.target.value
                        })
                    }
                >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                </select>

                <input
                    type="date"
                    className="w-full border rounded-lg p-3"
                    value={form.dueDate}
                    onChange={e =>
                        setForm({
                            ...form,
                            dueDate: e.target.value
                        })
                    }
                />

                <button className="bg-blue-700 text-white px-6 py-3 rounded-xl">
                    Assign Task
                </button>

            </form>

        </div>
    );
}