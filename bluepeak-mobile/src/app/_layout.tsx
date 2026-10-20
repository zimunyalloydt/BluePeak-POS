import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Stack } from "expo-router";

import { AuthProvider, useAuth } from "../context/AuthContext";

import {
    initializeLocalDatabase,
    setActiveOrganisation,
} from "../services/localDatabase";

import { startNetworkSync } from "../services/networkSyncService";

function AuthenticatedApp() {
    const { user, token, loading } = useAuth();

    const [databaseReady, setDatabaseReady] = useState(false);
    const [databaseError, setDatabaseError] = useState<string | null>(
        null
    );
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let stopNetworkSync: (() => void) | undefined;

        const prepareOrganisation = async () => {
            setDatabaseReady(false);
            setDatabaseError(null);

            if (loading || !user) {
                return;
            }

            try {
                await setActiveOrganisation(user.organisationId);

                await initializeLocalDatabase();

                if (cancelled) {
                    return;
                }

                setDatabaseReady(true);

                /*
                 * Only authenticated online sessions can synchronize.
                 * Offline sessions can continue using their local data.
                 */
                if (token) {
                    stopNetworkSync = startNetworkSync();
                }
            } catch (error) {
                console.error(
                    "Organisation database initialization failed:",
                    error
                );

                if (!cancelled) {
                    setDatabaseError(
                        "BluePeak could not open this organisation's local database. Check your device storage and retry."
                    );
                }
            }
        };

        void prepareOrganisation();

        return () => {
            cancelled = true;

            if (stopNetworkSync) {
                stopNetworkSync();
            }
        };
    }, [user?.organisationId, token, loading, retryCount]);

    if (loading) {
        return null;
    }

    if (user && databaseError) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>
                    Database Initialization Failed
                </Text>

                <Text style={styles.message}>
                    {databaseError}
                </Text>

                <Pressable
                    accessibilityRole="button"
                    style={styles.button}
                    onPress={() => setRetryCount((count) => count + 1)}
                >
                    <Text style={styles.buttonText}>
                        Retry
                    </Text>
                </Pressable>
            </View>
        );
    }

  

    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        />
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <AuthenticatedApp />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#FFFFFF",
    },
    title: {
        fontSize: 21,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
        color: "#B42318",
    },
    message: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 23,
        marginBottom: 24,
        color: "#333333",
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        backgroundColor: "#1D4ED8",
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
});
