import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRouter } from "expo-router";

import { getAdminUsers } from "../../services/adminService";

type User = {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
};

export default function AdminUsers() {
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] =
        useState<User[]>([]);

    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);

            const data = await getAdminUsers();

            setUsers(data);
            setFilteredUsers(data);
        } catch (error: any) {
            console.error(
                "Failed to load users:",
                error?.response?.data || error
            );

            Alert.alert(
                "Error",
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        const query = search
            .trim()
            .toLowerCase();

        if (!query) {
            setFilteredUsers(users);
            return;
        }

        const filtered = users.filter((user) =>
            [
                user.firstName,
                user.lastName,
                user.username,
                user.email,
                user.phone,
                user.role,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );

        setFilteredUsers(filtered);
    }, [search, users]);

    const refresh = async () => {
        try {
            setRefreshing(true);

            const data = await getAdminUsers();

            setUsers(data);
        } catch (error) {
            Alert.alert(
                "Error",
                "Failed to refresh users."
            );
        } finally {
            setRefreshing(false);
        }
    };

    const renderUser = ({
        item,
    }: {
        item: User;
    }) => {
        const fullName =
            `${item.firstName} ${item.lastName}`.trim();

        return (
            <View style={styles.userCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.firstName
                            ?.charAt(0)
                            .toUpperCase()}
                        {item.lastName
                            ?.charAt(0)
                            .toUpperCase()}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.name}>
                        {fullName || item.username}
                    </Text>

                    <Text style={styles.username}>
                        @{item.username}
                    </Text>

                    <Text style={styles.detail}>
                        {item.email}
                    </Text>

                    <Text style={styles.detail}>
                        {item.phone || "No phone"}
                    </Text>

                    <View style={styles.badges}>
                        <View
                            style={
                                styles.roleBadge
                            }
                        >
                            <Text
                                style={
                                    styles.roleText
                                }
                            >
                                {item.role}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statusBadge,
                                item.isActive
                                    ? styles.activeBadge
                                    : styles.inactiveBadge,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    item.isActive
                                        ? styles.activeText
                                        : styles.inactiveText,
                                ]}
                            >
                                {item.isActive
                                    ? "Active"
                                    : "Inactive"}
                            </Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    style={styles.manageButton}
                    onPress={() =>
                        Alert.alert(
                            "User Management",
                            `${fullName}\n\nUser management actions will be added next.`
                        )
                    }
                >
                    <Text
                        style={
                            styles.manageButtonText
                        }
                    >
                        Manage
                    </Text>
                </Pressable>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />

                <Text style={styles.loadingText}>
                    Loading users...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                >
                    <Text style={styles.back}>
                        ← Back
                    </Text>
                </Pressable>

                <Text style={styles.title}>
                    Staff & Users
                </Text>

                <Pressable
                    style={styles.addButton}
                    onPress={() =>
                        router.push(
                            "/admin/users/create"
                        )
                    }
                >
                    <Text
                        style={
                            styles.addButtonText
                        }
                    >
                        + Add
                    </Text>
                </Pressable>
            </View>

            <View style={styles.summary}>
                <View style={styles.summaryBox}>
                    <Text
                        style={
                            styles.summaryNumber
                        }
                    >
                        {users.length}
                    </Text>

                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        Total Users
                    </Text>
                </View>

                <View style={styles.summaryBox}>
                    <Text
                        style={
                            styles.summaryNumber
                        }
                    >
                        {
                            users.filter(
                                (u) => u.isActive
                            ).length
                        }
                    </Text>

                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        Active
                    </Text>
                </View>

                <View style={styles.summaryBox}>
                    <Text
                        style={
                            styles.summaryNumber
                        }
                    >
                        {
                            users.filter(
                                (u) =>
                                    u.role
                                        ?.toLowerCase()
                                        .includes(
                                            "cashier"
                                        )
                            ).length
                        }
                    </Text>

                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        Cashiers
                    </Text>
                </View>
            </View>

            <TextInput
                style={styles.search}
                value={search}
                onChangeText={setSearch}
                placeholder="Search users..."
                placeholderTextColor="#94a3b8"
            />

            {filteredUsers.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>
                        No users found
                    </Text>

                    <Text style={styles.emptyText}>
                        Try another search or add a
                        new user.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) =>
                        String(item.userId)
                    }
                    renderItem={renderUser}
                    contentContainerStyle={
                        styles.list
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refresh}
                        />
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
        padding: 20,
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fa",
    },

    loadingText: {
        marginTop: 10,
        color: "#64748b",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18,
    },

    back: {
        color: "#2563eb",
        fontSize: 16,
        fontWeight: "700",
    },

    title: {
        fontSize: 21,
        fontWeight: "800",
        color: "#111827",
    },

    addButton: {
        backgroundColor: "#2563eb",
        paddingHorizontal: 13,
        paddingVertical: 9,
        borderRadius: 9,
    },

    addButtonText: {
        color: "#fff",
        fontWeight: "800",
    },

    summary: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },

    summaryBox: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 13,
        alignItems: "center",
    },

    summaryNumber: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },

    summaryLabel: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 3,
    },

    search: {
        height: 48,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 11,
        paddingHorizontal: 14,
        marginBottom: 14,
        fontSize: 15,
        color: "#111827",
    },

    list: {
        paddingBottom: 30,
    },

    userCard: {
        backgroundColor: "#fff",
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        elevation: 2,
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#dbeafe",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    avatarText: {
        color: "#1d4ed8",
        fontSize: 15,
        fontWeight: "800",
    },

    userInfo: {
        flex: 1,
    },

    name: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    username: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },

    detail: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 4,
    },

    badges: {
        flexDirection: "row",
        gap: 7,
        marginTop: 9,
        flexWrap: "wrap",
    },

    roleBadge: {
        backgroundColor: "#eef2ff",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 7,
    },

    roleText: {
        color: "#4338ca",
        fontSize: 11,
        fontWeight: "700",
    },

    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 7,
    },

    activeBadge: {
        backgroundColor: "#dcfce7",
    },

    inactiveBadge: {
        backgroundColor: "#fee2e2",
    },

    statusText: {
        fontSize: 11,
        fontWeight: "700",
    },

    activeText: {
        color: "#166534",
    },

    inactiveText: {
        color: "#991b1b",
    },

    manageButton: {
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
    },

    manageButtonText: {
        color: "#334155",
        fontSize: 12,
        fontWeight: "700",
    },

    empty: {
        alignItems: "center",
        paddingTop: 60,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },

    emptyText: {
        marginTop: 6,
        color: "#64748b",
    },
});