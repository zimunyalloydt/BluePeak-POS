import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import NotificationPopup from "./NotificationPopup";
import {  getConnection} from "../../services/signalRService";
import {
    getNotifications,
    getUnreadCount,
    markAsRead
} from "../../services/notificationService";

export default function NotificationBell({onClick}) {

    const [notifications, setNotifications] = useState([]);
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [popup, setPopup] = useState(null);
    const connection = getConnection();

    async function load() {

    console.log("Loading notifications...");

    try {

        const list = await getNotifications();
        console.log("Notification list:", list);

        const unread = await getUnreadCount();
        console.log("Unread:", unread);

        setNotifications(list);
        setCount(unread);

    } catch (err) {

        console.error("Notification error:", err);

    }
}
   useEffect(() => {

    const timer = setInterval(() => {

        const connection = getConnection();

        if (!connection)
            return;

        connection.off("ReceiveNotification");

        connection.on("ReceiveNotification", notification => {

            console.log("LIVE NOTIFICATION", notification);

            load();
            setPopup(notification);

        });

        clearInterval(timer);

    }, 300);

    return () => clearInterval(timer);

}, []);


    useEffect(() => {
        load();
    }, []);

    async function openNotification(notification) {

        if (!notification.isRead) {
            await markAsRead(notification.notificationId);
            load();
        }

        // Later:
        // if task → navigate to task
        // if message → open chat
    }

    return (
        <div className="relative">

            

            <button
    onClick={onClick}
    className="relative p-2"
>
    <FaBell size={22} />

    {count > 0 && (
        <span className="absolute -top-1 -right-1 ...">
            {count}
        </span>
    )}
</button>

            {open && (

                <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-xl border z-50">

                    <div className="p-4 font-bold border-b">

                        Notifications

                    </div>

                    {notifications.length === 0 && (

                        <div className="p-4 text-gray-500">

                            No notifications

                        </div>

                    )}

                    {notifications.map(n => (

                        <div
                            key={n.notificationId}
                            onClick={() => openNotification(n)}
                            className={`p-4 cursor-pointer hover:bg-gray-100 border-b ${
                                !n.isRead
                                    ? "bg-blue-50"
                                    : ""
                            }`}
                        >

                            <h4 className="font-semibold">

                                {n.title}

                            </h4>

                            <p className="text-sm text-gray-600">

                                {n.message}

                            </p>

                        </div>

                    ))}

                </div>

            )}
            <NotificationPopup
    notification={popup}
    onDismiss={() => setPopup(null)}
    onOpen={() => {

        setPopup(null);

        // later:
        // navigate to task or message

    }}
/>

        </div>

        
    );
}