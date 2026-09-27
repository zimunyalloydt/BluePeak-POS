import React, { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    Pressable,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { getAdminDashboard } from "../../services/adminService";

type DashboardData = {
    todaySales: number;
    todayProfit: number;
    transactions: number;
    averageSale: number;
};

const SALES_TAPS_REQUIRED = 5;
const SALES_TAP_RESET_MS = 2500;

export default function AdminDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- Sales button tap gate ---
    const salesTapCount = useRef(0);
    const salesTapTimer = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    const loadDashboard = useCallback(async () => {
        try {
            const data = await getAdminDashboard();

            setDashboard(data);
        } catch (error: any) {
            console.error(
                "Dashboard error:",
                error
            );

            const message =
                error?.response?.data?.message ||
                "Failed to load dashboard.";

            Alert.alert(
                "Dashboard Error",
                String(message)
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const run = async () => {
                await Promise.resolve();
                if (!cancelled) {
                    await loadDashboard();
                }
            };

            run();

            return () => {
                cancelled = true;
            };
        }, [loadDashboard])
    );

    const refresh = async () => {
        setRefreshing(true);
        await loadDashboard();
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/");
    };

    const handleSalesPress = () => {
        salesTapCount.current += 1;

        // Reset the counter if the user stops tapping
        if (salesTapTimer.current) {
            clearTimeout(salesTapTimer.current);
        }

        if (salesTapCount.current >= SALES_TAPS_REQUIRED) {
            salesTapCount.current = 0;
            salesTapTimer.current = null;
            router.push("/admin/sales");
            return;
        }

        salesTapTimer.current = setTimeout(() => {
            salesTapCount.current = 0;
            salesTapTimer.current = null;
        }, SALES_TAP_RESET_MS);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingScreen}>
                <ActivityIndicator size="large" />

                <Text style={styles.loadingText}>
                    Loading dashboard...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                }
            >
                {/* HEADER */}

                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>
                            BLUEPEAK
                        </Text>

                        <Text style={styles.title}>
                            Admin Dashboard
                        </Text>

                        <Text style={styles.subtitle}>
                            Business overview
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <Text style={styles.logoutText}>
                            Logout
                        </Text>
                    </Pressable>
                </View>

                {/* USER */}

                <View style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.fullName
                                ?.charAt(0)
                                .toUpperCase()}
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.welcome}>
                            Welcome back
                        </Text>

                        <Text style={styles.fullName}>
                            {user?.fullName}
                        </Text>

                        <Text style={styles.role}>
                            Administrator
                        </Text>
                    </View>
                </View>

                {/* MANAGEMENT */}

                <Text style={styles.sectionTitle}>
                    Management
                </Text>

                <View style={styles.menuGrid}>
                    <Pressable
                        style={styles.menuCard}
                        onPress={() =>
                            router.push("/admin/products")
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                P
                            </Text>
                        </View>

                        <Text style={styles.menuTitle}>
                            Products
                        </Text>

                        <Text style={styles.menuDescription}>
                            Manage products
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.menuCard}
                        onPress={() =>
                            router.push("/admin/users")
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                S
                            </Text>
                        </View>

                        <Text style={styles.menuTitle}>
                            Staff
                        </Text>

                        <Text style={styles.menuDescription}>
                            Manage users
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.menuCard}
                        onPress={handleSalesPress}
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                $
                            </Text>
                        </View>

                        <Text style={styles.menuTitle}>
                            Sales
                        </Text>

                        <Text style={styles.menuDescription}>
                            View transactions
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.menuCard}
                        onPress={() =>
                            router.push("/admin/tasks")
                        }
                    >
                        <View style={styles.menuIcon}>
                            <Text style={styles.menuIconText}>
                                T
                            </Text>
                        </View>

                        <Text style={styles.menuTitle}>
                            Tasks
                        </Text>

                        <Text style={styles.menuDescription}>
                            Manage tasks
                        </Text>
                    </Pressable>
                </View>

                {/* REFRESH */}

                <Pressable
                    onPress={refresh}
                    style={styles.refreshButton}
                >
                    <Text style={styles.refreshButtonText}>
                        Refresh Dashboard
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    content: {
        padding: 18,
        paddingBottom: 40,
    },

    loadingScreen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F7FA",
    },

    loadingText: {
        marginTop: 12,
        color: "#6B7280",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },

    brand: {
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 2,
        color: "#0B1F3A",
    },

    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#172033",
        marginTop: 4,
    },

    subtitle: {
        color: "#7B8492",
        fontSize: 13,
        marginTop: 3,
    },

    logoutButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDE2E8",
        borderRadius: 9,
        paddingHorizontal: 13,
        paddingVertical: 9,
    },

    logoutText: {
        color: "#D64545",
        fontWeight: "700",
        fontSize: 12,
    },

    userCard: {
        backgroundColor: "#0B1F3A",
        borderRadius: 16,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 26,
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },

    avatarText: {
        fontSize: 21,
        fontWeight: "900",
        color: "#0B1F3A",
    },

    welcome: {
        color: "#AAB8CA",
        fontSize: 11,
    },

    fullName: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        marginTop: 2,
    },

    role: {
        color: "#8FA1B8",
        fontSize: 11,
        marginTop: 2,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 12,
    },

    menuGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 10,
    },

    menuCard: {
        width: "48.5%",
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E1E5EA",
        minHeight: 135,
    },

    menuIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#EAF1FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    menuIconText: {
        color: "#1769E0",
        fontSize: 17,
        fontWeight: "900",
    },

    menuTitle: {
        color: "#172033",
        fontSize: 15,
        fontWeight: "800",
    },

    menuDescription: {
        color: "#7B8492",
        fontSize: 11,
        marginTop: 4,
    },

    refreshButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DDE2E8",
        borderRadius: 11,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 20,
    },

    refreshButtonText: {
        color: "#1769E0",
        fontWeight: "800",
        fontSize: 13,
    },
});