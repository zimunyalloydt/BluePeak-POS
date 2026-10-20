import * as Network from "expo-network";

import { syncPendingSales } from "./syncService";
import { getToken, getUser } from "../storage/authStorage";
import { getActiveOrganisationId } from "./localDatabase";

let isSyncing = false;
let activeMonitorId = 0;
let activeInterval: ReturnType<typeof setInterval> | null = null;

async function runSync(monitorId: number): Promise<void> {
    if (isSyncing || monitorId !== activeMonitorId) {
        return;
    }

    isSyncing = true;

    try {
        const token = await getToken();
        const user = await getUser();
        const organisationId = getActiveOrganisationId();

        // Require a valid stored online session.
        if (
            !token ||
            !user ||
            !organisationId ||
            user.organisationId !== organisationId
        ) {
            console.log(
                "Sync skipped: no matching authenticated organisation."
            );
            return;
        }

        const networkState = await Network.getNetworkStateAsync();

        if (
            !networkState.isConnected ||
            networkState.isInternetReachable === false
        ) {
            console.log("No internet connection. Sync skipped.");
            return;
        }

        // Recheck the monitor and session before starting.
        if (monitorId !== activeMonitorId) {
            return;
        }

        const latestToken = await getToken();
        const latestUser = await getUser();

        if (
            latestToken !== token ||
            !latestUser ||
            latestUser.organisationId !== organisationId ||
            getActiveOrganisationId() !== organisationId
        ) {
            console.log(
                "Sync cancelled: the active session changed."
            );
            return;
        }

        console.log(
            `Checking pending sales for organisation ${organisationId}...`
        );

        await syncPendingSales();
    } catch (error) {
        console.error("Automatic sync failed:", error);
    } finally {
        isSyncing = false;
    }
}

export function startNetworkSync(): () => void {
    // Avoid starting duplicate monitors.
    if (activeInterval !== null) {
        clearInterval(activeInterval);
        activeInterval = null;
    }

    const monitorId = ++activeMonitorId;

    console.log("Starting BluePeak network sync monitor.");

    void runSync(monitorId);

    activeInterval = setInterval(() => {
        void runSync(monitorId);
    }, 10_000);

    return () => {
        if (monitorId !== activeMonitorId) {
            return;
        }

        console.log("Stopping BluePeak network sync monitor.");

        ++activeMonitorId;

        if (activeInterval !== null) {
            clearInterval(activeInterval);
            activeInterval = null;
        }
    };
}
