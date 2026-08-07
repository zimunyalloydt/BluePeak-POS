import { FaTasks, FaEnvelope } from "react-icons/fa";

export default function NotificationPopup({
    notification,
    onOpen,
    onDismiss
}) {
    if (!notification) return null;

    return (
        <div className="fixed top-5 right-5 w-96 bg-white rounded-xl shadow-2xl border z-[9999] animate-slideIn">

            <div className="p-5">

                <div className="flex items-center gap-3 mb-3">

                    {notification.type === "Task" ? (
                        <FaTasks className="text-blue-600 text-xl" />
                    ) : (
                        <FaEnvelope className="text-green-600 text-xl" />
                    )}

                    <h3 className="font-bold text-lg">
                        {notification.title}
                    </h3>

                </div>

                <p className="text-gray-700 mb-6">
                    {notification.message}
                </p>

                <div className="flex justify-end gap-3">

                    <button
                        onClick={onDismiss}
                        className="px-4 py-2 rounded-lg bg-gray-200"
                    >
                        Dismiss
                    </button>

                    <button
                        onClick={onOpen}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                    >
                        Open
                    </button>

                </div>

            </div>

        </div>
    );
}