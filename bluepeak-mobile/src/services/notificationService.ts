import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
} from "@microsoft/signalr";

import { getToken } from "../storage/authStorage";

const HUB_URL =
    "http://192.168.0.217:5160/notificationHub";

let connection: HubConnection | null = null;

export async function startNotificationConnection(
    userId: number,
    onNotification: (notification: any) => void
) {
    if (connection) {
        return connection;
    }

    const token = await getToken();

    if (!token) {
        throw new Error(
            "No authentication token available."
        );
    }

    connection = new HubConnectionBuilder()
        .withUrl(HUB_URL, {
            accessTokenFactory: async () => {
                const currentToken = await getToken();
                return currentToken ?? "";
            },
        })
        .withAutomaticReconnect([
            0,
            2000,
            5000,
            10000,
        ])
        .configureLogging(LogLevel.Warning)
        .build();

    connection.on(
        "ReceiveNotification",
        (notification) => {
            console.log(
                "🔔 SignalR notification:",
                notification
            );

            onNotification(notification);
        }
    );

    connection.onreconnected(async () => {
        console.log(
            "🔄 SignalR reconnected."
        );

        try {
            await connection?.invoke(
                "JoinUserGroup",
                userId
            );

            console.log(
                `✅ Rejoined User_${userId}`
            );
        } catch (error) {
            console.error(
                "Failed to rejoin SignalR group:",
                error
            );
        }
    });

    connection.onclose((error) => {
        if (error) {
            console.error(
                "SignalR connection closed:",
                error
            );
        } else {
            console.log(
                "SignalR connection closed."
            );
        }
    });

    await connection.start();

    console.log(
        "✅ SignalR connected."
    );

    await connection.invoke(
        "JoinUserGroup",
        userId
    );

    console.log(
        `✅ Joined User_${userId}`
    );

    return connection;
}

export async function stopNotificationConnection() {
    if (!connection) {
        return;
    }

    try {
        await connection.stop();
    } catch (error) {
        console.error(
            "Failed to stop SignalR:",
            error
        );
    }

    connection = null;
}