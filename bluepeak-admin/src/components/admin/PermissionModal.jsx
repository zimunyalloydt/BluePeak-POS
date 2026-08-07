import { useEffect, useState } from "react";
import {
    getUserPermissions,
    saveUserPermissions
} from "../../services/permissionService";

export default function PermissionModal({
    open,
    user,
    onClose
}) {

    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (!open || !user) return;

        loadPermissions();

    }, [open, user]);

    async function loadPermissions() {

        setLoading(true);

        try {

            const data = await getUserPermissions(user.userId);

            setPermissions(data);

        } finally {

            setLoading(false);

        }

    }

    function toggle(id) {

        setPermissions(prev =>
            prev.map(p =>
                p.permissionId === id
                    ? { ...p, assigned: !p.assigned }
                    : p
            )
        );

    }

    async function save() {

        const selected = permissions
            .filter(p => p.assigned)
            .map(p => p.permissionId);

        await saveUserPermissions(
            user.userId,
            selected
        );

        alert("Permissions updated.");

        onClose();

    }

    if (!open) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl shadow-xl w-[650px]">

                <div className="border-b p-5">

                    <h2 className="text-2xl font-bold">

                        Permissions

                    </h2>

                    <p className="text-gray-500">

                        {user.firstName} {user.lastName}

                    </p>

                </div>

                <div className="p-6 max-h-[450px] overflow-y-auto">

                    {loading ? (

                        <p>Loading...</p>

                    ) : (

                        permissions.map(permission => (

                            <label
                                key={permission.permissionId}
                                className="flex items-center justify-between border rounded-xl p-4 mb-3 cursor-pointer hover:bg-gray-50"
                            >

                                <span>

                                    {permission.name}

                                </span>

                                <input
                                    type="checkbox"
                                    checked={permission.assigned}
                                    onChange={() =>
                                        toggle(permission.permissionId)
                                    }
                                />

                            </label>

                        ))

                    )}

                </div>

                <div className="border-t p-5 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl bg-gray-200"
                    >

                        Cancel

                    </button>

                    <button
                        onClick={save}
                        className="px-5 py-3 rounded-xl bg-blue-700 text-white"
                    >

                        Save Permissions

                    </button>

                </div>

            </div>

        </div>

    );

}