import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaShieldAlt } from "react-icons/fa";
import AdminLayout from "../../components/admin/AdminLayout";
import { getUsers, createUser } from "../../services/userService";
import UserModal from "../../components/admin/UserModal";
import PermissionModal from "../../components/admin/PermissionModal";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateUser(userData) {
        setIsSubmitting(true);
        try {
            await createUser(userData);
            setShowModal(false);
            await loadUsers(); // Reload the list after successful creation
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || "Failed to create user.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const filteredUsers = useMemo(() => {
        const term = search.toLowerCase();

        return users.filter(u =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
            u.username?.toLowerCase().includes(term) ||
            u.role?.toLowerCase().includes(term)
        );
    }, [users, search]);

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold">Users</h1>
                    <p className="text-gray-500">
                        Manage employees and system access
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
                >
                    <FaPlus />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow">
                <div className="p-5 border-b">
                    <div className="relative w-96">
                        <FaSearch className="absolute left-4 top-4 text-gray-400" />
                        <input
                            className="border rounded-xl pl-12 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Username</th>
                            <th className="p-4 text-left">Role</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center p-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-gray-500">
                                    {search ? "No users found matching your search." : "No users available."}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr
                                    key={user.userId}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="p-4 font-medium">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="p-4">
                                        {user.username}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            user.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${
                                            user.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}>
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-3">
                                            <button 
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                onClick={() => {/* Handle edit */}}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
    onClick={() => {

        setSelectedUser(user);

        setShowPermissions(true);

    }}
    className="text-blue-600 hover:text-blue-800"
>
    <FaShieldAlt />
</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <UserModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleCreateUser}
                loading={isSubmitting}
            />

            <PermissionModal
    open={showPermissions}
    user={selectedUser}
    onClose={() => {

        setShowPermissions(false);

        setSelectedUser(null);

    }}
/>
        </AdminLayout>
    );
}