import * as Network from "expo-network";
import { syncPendingSales } from "./syncService";

let isSyncing = false;

/**
 * Prevent multiple sync operations from
 * running at the same time.
 */
async function runSync() {
    if (isSyncing) {
        console.log(
            "⏳ Sync already running..."
        );
        return;
    }

    try {
        isSyncing = true;

        const networkState =
            await Network.getNetworkStateAsync();

        if (
            !networkState.isConnected ||
            !networkState.isInternetReachable
        ) {
            console.log(
                "📴 No internet connection. Sync skipped."
            );
            return;
        }

        console.log(
            "🌐 Internet available. Checking pending sales..."
        );

        await syncPendingSales();
    } catch (error) {
        console.error(
            "❌ Automatic sync failed:",
            error
        );
    } finally {
        isSyncing = false;
    }
}

/**
 * Start network monitoring.
 *
 * expo-network does not provide a persistent
 * connectivity listener, so we periodically
 * check the network state.
 */
export function startNetworkSync() {
    console.log(
        "🌐 Starting BluePeak network sync monitor..."
    );

    /*
     * Check immediately when monitoring starts.
     */
    runSync();

    /*
     * Check every 10 seconds.
     *
     * This allows an already-open POS to detect
     * when the server/network becomes available.
     */
    const interval = setInterval(() => {
        runSync();
    }, 10_000);

    /*
     * Return a cleanup function so the interval
     * can be stopped when the app unmounts.
     */
    return () => {
        console.log(
            "🛑 Stopping BluePeak network sync monitor."
        );

        clearInterval(interval);
    };
}