import { useEffect } from "react";
import { initializeLocalDatabase } from "../services/localDatabase";
import { syncPendingSales } from "../services/syncService";
import { startNetworkSync } from "../services/networkSyncService";
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
    useEffect(() => {
        let stopNetworkSync:
            (() => void) | undefined;

        const initializeApp = async () => {
            try {
                await initializeLocalDatabase();

                console.log(
                    "✅ Local database initialized"
                );

                /*
                 * Attempt to synchronize any
                 * pending offline sales immediately.
                 */
                await syncPendingSales();

                /*
                 * Continue monitoring the network
                 * while the application is open.
                 */
                stopNetworkSync =
                    startNetworkSync();
            } catch (error) {
                console.error(
                    "❌ App initialization failed:",
                    error
                );
            }
        };

        initializeApp();

        return () => {
            if (stopNetworkSync) {
                stopNetworkSync();
            }
        };
    }, []);

    return (
        <AuthProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </AuthProvider>
    );
}