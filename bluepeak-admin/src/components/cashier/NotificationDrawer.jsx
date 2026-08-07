export default function NotificationDrawer({
    open,
    onClose,
    notifications = []
}) {
    if (!open) return null;

    return (
        <div className="fixed top-0 right-0 w-96 h-screen bg-white shadow-2xl z-50">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Notifications</h2>

                <button onClick={onClose}>✕</button>
            </div>

            <div className="p-4">
                {notifications.length === 0 ? (
                    <p className="text-gray-500">No notifications.</p>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="border rounded-lg p-3 mb-3"
                        >
                            {notification.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}