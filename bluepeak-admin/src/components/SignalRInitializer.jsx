import { useEffect } from "react";
import { startSignalR } from "../services/signalRService";
import { useNotification } from "../context/NotificationContext";
import { getConnection } from "../services/signalRService";

export default function SignalRInitializer() {
    const { showNotification } = useNotification();

    useEffect(() => {
        async function init() {
            try {
                const token = localStorage.getItem("token");

                if (!token) return;

                const user = JSON.parse(localStorage.getItem("user"));

                if (!user) return;

                const connection = await startSignalR(token);

                // Join this cashier's SignalR group
                await connection.invoke("JoinUserGroup", user.userId);

                // Prevent duplicate listeners
 
                // Remove any old listeners first
connection.off("ReceiveNotification");
connection.off("ReceiveMessage");

// Task notifications
connection.on("ReceiveNotification", data => {

    console.log("🔔 TASK RECEIVED", data);

    showNotification({
        type: "task",
        title: data.title,
        message: data.message,
        priority: data.priority,
        taskId: data.taskId
    });

    window.dispatchEvent(
        new CustomEvent("bluepeak-task", {
            detail: data
        })
    );
});

// Chat messages
connection.on("ReceiveMessage", message => {

    console.log("💬 MESSAGE RECEIVED", message);

    window.dispatchEvent(
        new CustomEvent("bluepeak-message", {
            detail: message
        })
    );
});

                console.log("Joined SignalR group:", user.userId);

            } catch (err) {
                console.error("SignalR Error", err);
            }
        }

        init();
    }, []);

    return null;
}