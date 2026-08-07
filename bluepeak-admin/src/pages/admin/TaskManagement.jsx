import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { createTask, getAllTasks } from "../../services/taskService";
import { getUsers } from "../../services/userService";


export default function TaskManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Normal",
        dueDate: "",
        userIds: [],
        assignToAll: false // Add this to your form state
    });

    useEffect(() => {
        loadUsers();
        loadTasks();


    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function loadTasks() {
    try {

        const data = await getAllTasks();

        setTasks(data);

    }
    catch (err) {

        console.error(err);

    }
}


    async function saveTask(e) {
        e.preventDefault();

        // Validation: Check if title is provided
        if (!form.title.trim()) {
            alert("Please enter a task title.");
            return;
        }

        // Validation: Check if users are selected or assignToAll is checked
        if (!form.assignToAll && form.userIds.length === 0) {
            alert("Please select at least one user or assign to all staff.");
            return;
        }

        try {
            setLoading(true);
            
            // Prepare the data to send
            const taskData = {
                title: form.title,
                description: form.description,
                priority: form.priority,
                dueDate: form.dueDate === "" ? null : form.dueDate, // Convert empty string to null
                userIds: form.assignToAll ? [] : form.userIds, // Empty array if assignToAll
                assignToAll: form.assignToAll
            };

            await createTask(taskData);
            await loadTasks(); // Reload tasks after creating a new one

            alert("Task assigned successfully.");

            // Reset form
            setForm({
                title: "",
                description: "",
                priority: "Normal",
                dueDate: "",
                userIds: [],
                assignToAll: false
            });

        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to assign task.");
        } finally {
            setLoading(false);
        }
    }

    // Handle "Assign to All" checkbox change
    const handleAssignToAllChange = (checked) => {
        setForm({
            ...form,
            assignToAll: checked,
            userIds: checked ? [] : form.userIds // Clear selected users when "Assign to All" is checked
        });
    };

    // Handle individual user checkbox change
    const handleUserCheckboxChange = (userId, checked) => {
        if (checked) {
            setForm({
                ...form,
                userIds: [...form.userIds, userId]
            });
        } else {
            setForm({
                ...form,
                userIds: form.userIds.filter(id => id !== userId)
            });
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto p-4">
                <h1 className="text-3xl font-bold mb-8">
                    Assign Task
                </h1>

                <form
                    onSubmit={saveTask}
                    className="bg-white shadow rounded-2xl p-8 space-y-6"
                >
                    {/* Task Title */}
                    <div>
                        <label className="block mb-2 font-semibold">
                            Task Title *
                        </label>
                        <input
                            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter task title"
                            value={form.title}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    title: e.target.value
                                })
                            }
                            required
                        />
                    </div>

                    {/* Task Description */}
                    <div>
                        <label className="block mb-2 font-semibold">
                            Task Description
                        </label>
                        <textarea
                            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={5}
                            placeholder="Enter task description"
                            value={form.description}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    description: e.target.value
                                })
                            }
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block mb-2 font-semibold">
                            Priority
                        </label>
                        <select
                            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.priority}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    priority: e.target.value
                                })
                            }
                        >
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block mb-2 font-semibold">
                            Due Date
                        </label>
                        <input
                            type="date"
                            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.dueDate}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    dueDate: e.target.value
                                })
                            }
                        />
                    </div>

                    {/* Assign Users Section */}
                    <div>
                        <h2 className="font-bold mb-4">
                            Assign Users *
                        </h2>

                        {/* Assign to All Staff */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.assignToAll}
                                    onChange={(e) => 
                                        handleAssignToAllChange(e.target.checked)
                                    }
                                    className="w-4 h-4"
                                />
                                <span className="font-medium">
                                    Assign to All Staff
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                    (This will assign the task to all active users)
                                </span>
                            </label>
                        </div>

                        {/* Individual User Selection */}
                        {!form.assignToAll && (
                            <>
                                <div className="text-sm text-gray-500 mb-3">
                                    Select users to assign this task to:
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {loading ? (
                                        <div className="col-span-2 text-center text-gray-500 py-4">
                                            Loading users...
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="col-span-2 text-center text-gray-500 py-4">
                                            No users available.
                                        </div>
                                    ) : (
                                        users.map(user => (
                                            <label
                                                key={user.userId}
                                                className="border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.userIds.includes(user.userId)}
                                                    onChange={(e) =>
                                                        handleUserCheckboxChange(
                                                            user.userId,
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="w-4 h-4"
                                                />
                                                <div>
                                                    <div className="font-semibold">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.role || "Staff"}
                                                    </div>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Show selected users count */}
                        {!form.assignToAll && form.userIds.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">
                                Selected: {form.userIds.length} user{form.userIds.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setForm({
                                    title: "",
                                    description: "",
                                    priority: "Normal",
                                    dueDate: "",
                                    userIds: [],
                                    assignToAll: false
                                });
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg transition-colors ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Assigning...' : 'Assign Task'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-10">

    <h2 className="text-2xl font-bold mb-5">
        All Tasks
    </h2>

    <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

            <thead className="bg-gray-100">

                <tr>

                    <th className="p-4 text-left">
                        Task
                    </th>

                    <th className="p-4 text-left">
                        Assigned
                    </th>

                    <th className="p-4">
                        Priority
                    </th>

                    <th className="p-4">
                        Status
                    </th>

                    <th className="p-4">
                        Due Date
                    </th>

                </tr>

            </thead>

            <tbody>

                {tasks.map(task => (

                    <tr
                        key={task.taskItemId}
                        className="border-t"
                    >

                        <td className="p-4">

                            <div className="font-semibold">
                                {task.title}
                            </div>

                            <div className="text-sm text-gray-500">
                                {task.description}
                            </div>

                        </td>

                        <td className="p-4">

                            {task.assignedUsers.join(", ")}

                        </td>

                        <td className="p-4">

                            {task.priority}

                        </td>

                        <td className="p-4">

                            <span className={`px-3 py-1 rounded-full text-sm ${
                                task.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}>

                                {task.status}

                            </span>

                        </td>

                        <td className="p-4">

                            {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "-"}

                        </td>

                    </tr>

                ))}

            </tbody>

        </table>

    </div>

</div>
        </AdminLayout>
    );
}