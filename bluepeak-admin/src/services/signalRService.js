import * as signalR from "@microsoft/signalr";

let connection = null;

export async function startSignalR(token) {

    if (connection)
        return connection;

    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5160/notificationHub", {
            accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

    await connection.start();

    console.log("SignalR Connected");

    return connection;
}

export function getConnection() {
    return connection;
}

export function on(eventName, callback) {
    if (!connection) return;
    connection.on(eventName, callback);
}

export function off(eventName, callback) {
    if (!connection) return;
    connection.off(eventName, callback);
}

export async function invoke(method, ...args) {
    if (!connection) return;
    return await connection.invoke(method, ...args);
}