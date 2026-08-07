import { useState } from "react";

export default function UserModal({
    open,
    onClose,
    onSave
}) {

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        roleId: 3,
        isActive: true
    });

    if (!open) return null;

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        await onSave(form);

        setForm({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            phone: "",
            password: "",
            roleId: 3,
            isActive: true
        });
    }

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl shadow-xl w-[700px]">

                <div className="p-6 border-b">

                    <h2 className="text-2xl font-bold">

                        Create User

                    </h2>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6 grid grid-cols-2 gap-5"
                >

                    <Input
                        label="First Name"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                    />

                    <Input
                        label="Last Name"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                    />

                    <Input
                        label="Username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                    />

                    <Input
                        label="Email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <Input
                        label="Phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />

                    <div>

                        <label className="block mb-2">

                            Role

                        </label>

                        <select
                            name="roleId"
                            value={form.roleId}
                            onChange={handleChange}
                            className="w-full border rounded-xl p-3"
                        >

                            <option value={1}>Admin</option>

                            <option value={2}>Manager</option>

                            <option value={3}>Cashier</option>

                        </select>

                    </div>

                    <div className="flex items-center mt-8">

                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={handleChange}
                        />

                        <span className="ml-3">

                            Active User

                        </span>

                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-6">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-xl bg-gray-200"
                        >

                            Cancel

                        </button>

                        <button
                            className="px-5 py-3 rounded-xl bg-blue-700 text-white"
                        >

                            Save User

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}

function Input({
    label,
    ...props
}) {

    return (

        <div>

            <label className="block mb-2">

                {label}

            </label>

            <input
                {...props}
                className="w-full border rounded-xl p-3"
            />

        </div>

    );

}