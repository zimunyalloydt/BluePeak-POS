import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUnreadCount } from "../../services/messageService";
import CashierHeader from "./CashierHeader";
import CashierSidebar from "./CashierSidebar";
import AttentionOverlay from "./AttentionOverlay";

export default function CashierLayout({
    children,

    onOpenTasks,
    onOpenMessages,
    onOpenNotifications,

    taskCount,
    messageCount,
    notificationCount
}) {

    const navigate = useNavigate();

    const [overlayOpen, setOverlayOpen] = useState(false);

    const [overlayData, setOverlayData] = useState(null);

    const [unread, setUnread] = useState(0);

useEffect(() => {
    loadUnread();
}, []);

async function loadUnread() {
    const count = await getUnreadCount();
    setUnread(count);
}

    return (
        <div className="h-screen flex bg-slate-100">

            <CashierSidebar />

            <div className="flex-1 flex flex-col">

                <CashierHeader
                    onOpenTasks={onOpenTasks}
                    onOpenMessages={onOpenMessages}
                    onOpenNotifications={onOpenNotifications}
                    taskCount={taskCount}
                    messageCount={messageCount}
                    notificationCount={notificationCount}
                />

                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>

            </div>

            <AttentionOverlay
                open={overlayOpen}
                type={overlayData?.type}
                title={overlayData?.title}
                message={overlayData?.message}
                priority={overlayData?.priority}
                onView={() => {

                    setOverlayOpen(false);

                    if (overlayData?.type === "task") {
                        navigate("/cashier/tasks");
                    } else {
                        navigate("/cashier/messages");
                    }

                }}
            />

        </div>
    );
}