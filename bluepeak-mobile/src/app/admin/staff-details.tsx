import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
    getAdminUsers,
    getUserPermissions,
    updateUserPermissions,
} from "../../services/adminService";

type Staff = {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
};

type Permission = {
    permissionId: number;
    name: string;
    assigned: boolean;
};

export default function StaffDetailsScreen() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        userId: string;
    }>();

    const userId = Number(params.userId);

    const [staff, setStaff] = useState<Staff | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        if (!userId || Number.isNaN(userId)) {
            Alert.alert("Error", "Invalid staff member.");
            router.back();
            return;
        }

        try {
            setLoading(true);

            const [users, permissionData] = await Promise.all([
                getAdminUsers(),
                getUserPermissions(userId),
            ]);

            const selectedStaff = Array.isArray(users)
                ? users.find(
                      (user: Staff) => user.userId === userId
                  )
                : null;

            setStaff(selectedStaff ?? null);

            setPermissions(
                Array.isArray(permissionData)
                    ? permissionData
                    : []
            );
        } catch (error: any) {
            console.error("Failed to load staff details:", error);

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                    "Failed to load staff details."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router, userId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const togglePermission = (permissionId: number) => {
        setPermissions((current) =>
            current.map((permission) =>
                permission.permissionId === permissionId
                    ? {
                          ...permission,
                          assigned: !permission.assigned,
                      }
                    : permission
            )
        );
    };

    const assignedCount = useMemo(
        () =>
            permissions.filter(
                (permission) => permission.assigned
            ).length,
        [permissions]
    );

    const savePermissions = async () => {
        try {
            setSaving(true);

            const permissionIds = permissions
                .filter((permission) => permission.assigned)
                .map((permission) => permission.permissionId);

            await updateUserPermissions(
                userId,
                permissionIds
            );

            Alert.alert(
                "Permissions Updated",
                "Staff permissions have been saved successfully."
            );

            await loadData();
        } catch (error: any) {
            console.error(
                "Failed to update permissions:",
                error
            );

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                    "Failed to update permissions."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>
                        Loading staff details...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!staff) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        Staff member not found
                    </Text>

                    <Text
                        style={styles.backText}
                        onPress={() => router.back()}
                    >
                        Go Back
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const initials =
        `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`.toUpperCase();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    ←
                </Text>

                <Text style={styles.headerTitle}>
                    Staff Details
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            >
                {/* Profile */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {initials}
                        </Text>
                    </View>

                    <Text style={styles.name}>
                        {staff.firstName} {staff.lastName}
                    </Text>

                    <Text style={styles.username}>
                        @{staff.username}
                    </Text>

                    <View style={styles.badges}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {staff.role}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statusBadge,
                                staff.isActive
                                    ? styles.activeBadge
                                    : styles.inactiveBadge,
                            ]}
                        >
                            <View
                                style={[
                                    styles.statusDot,
                                    staff.isActive
                                        ? styles.activeDot
                                        : styles.inactiveDot,
                                ]}
                            />

                            <Text
                                style={[
                                    styles.statusText,
                                    staff.isActive
                                        ? styles.activeText
                                        : styles.inactiveText,
                                ]}
                            >
                                {staff.isActive
                                    ? "Active"
                                    : "Inactive"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Contact information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Contact Information
                    </Text>

                    <View style={styles.infoCard}>
                        <InfoRow
                            label="Email"
                            value={staff.email}
                        />

                        <InfoRow
                            label="Phone"
                            value={
                                staff.phone?.trim()
                                    ? staff.phone
                                    : "Not provided"
                            }
                        />

                        <InfoRow
                            label="Username"
                            value={staff.username}
                            last
                        />
                    </View>
                </View>

                {/* Permissions */}
                <View style={styles.section}>
                    <View style={styles.permissionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                Permissions
                            </Text>

                            <Text style={styles.permissionSummary}>
                                {assignedCount} of{" "}
                                {permissions.length} assigned
                            </Text>
                        </View>
                    </View>

                    <View style={styles.permissionCard}>
                        {permissions.length === 0 ? (
                            <View style={styles.noPermissions}>
                                <Text style={styles.noPermissionsText}>
                                    No permissions available.
                                </Text>
                            </View>
                        ) : (
                            permissions.map(
                                (permission, index) => (
                                    <View
                                        key={
                                            permission.permissionId
                                        }
                                        style={[
                                            styles.permissionRow,
                                            index ===
                                            permissions.length - 1
                                                ? styles.lastRow
                                                : null,
                                        ]}
                                    >
                                        <View style={styles.permissionInfo}>
                                            <Text
                                                style={
                                                    styles.permissionName
                                                }
                                            >
                                                {permission.name}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.permissionDescription
                                                }
                                            >
                                                {permission.assigned
                                                    ? "Permission granted"
                                                    : "Permission not granted"}
                                            </Text>
                                        </View>

                                        <Switch
                                            value={
                                                permission.assigned
                                            }
                                            onValueChange={() =>
                                                togglePermission(
                                                    permission.permissionId
                                                )
                                            }
                                            disabled={saving}
                                        />
                                    </View>
                                )
                            )
                        )}
                    </View>
                </View>

                {/* Save */}
                <View style={styles.saveSection}>
                    <Text
                        style={styles.saveHint}
                    >
                        Changes will immediately update this staff
                        member's permissions.
                    </Text>

                    <View
                        style={[
                            styles.saveButton,
                            saving && styles.saveButtonDisabled,
                        ]}
                    >
                        <Text
                            style={styles.saveButtonText}
                            onPress={
                                saving
                                    ? undefined
                                    : savePermissions
                            }
                        >
                            {saving
                                ? "Saving..."
                                : "Save Permissions"}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({
    label,
    value,
    last = false,
}: {
    label: string;
    value: string;
    last?: boolean;
}) {
    return (
        <View
            style={[
                styles.infoRow,
                last ? styles.lastRow : null,
            ]}
        >
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    header: {
        height: 64,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    backButton: {
        fontSize: 30,
        width: 40,
        color: "#111827",
    },

    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },

    headerSpacer: {
        width: 40,
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 24,
        alignItems: "center",
        marginBottom: 22,
    },

    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    avatarText: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "800",
    },

    name: {
        fontSize: 23,
        fontWeight: "800",
        color: "#111827",
    },

    username: {
        marginTop: 4,
        fontSize: 14,
        color: "#6B7280",
    },

    badges: {
        flexDirection: "row",
        marginTop: 16,
        gap: 8,
    },

    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#EEF2FF",
    },

    roleText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#4338CA",
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },

    activeBadge: {
        backgroundColor: "#ECFDF5",
    },

    inactiveBadge: {
        backgroundColor: "#FEF2F2",
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 6,
    },

    activeDot: {
        backgroundColor: "#10B981",
    },

    inactiveDot: {
        backgroundColor: "#EF4444",
    },

    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },

    activeText: {
        color: "#047857",
    },

    inactiveText: {
        color: "#B91C1C",
    },

    section: {
        marginBottom: 22,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 10,
    },

    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
    },

    infoRow: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F1F3",
    },

    lastRow: {
        borderBottomWidth: 0,
    },

    infoLabel: {
        fontSize: 13,
        color: "#6B7280",
    },

    infoValue: {
        flex: 1,
        marginLeft: 20,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },

    permissionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    permissionSummary: {
        marginTop: -5,
        marginBottom: 10,
        fontSize: 13,
        color: "#6B7280",
    },

    permissionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
    },

    permissionRow: {
        minHeight: 72,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F1F3",
    },

    permissionInfo: {
        flex: 1,
        paddingRight: 15,
    },

    permissionName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },

    permissionDescription: {
        marginTop: 4,
        fontSize: 12,
        color: "#6B7280",
    },

    noPermissions: {
        padding: 25,
        alignItems: "center",
    },

    noPermissionsText: {
        color: "#6B7280",
        fontSize: 14,
    },

    saveSection: {
        marginTop: 2,
    },

    saveHint: {
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 18,
        marginBottom: 12,
    },

    saveButton: {
        backgroundColor: "#111827",
        minHeight: 54,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    saveButtonDisabled: {
        opacity: 0.6,
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        marginTop: 12,
        color: "#6B7280",
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 15,
    },

    backText: {
        color: "#2563EB",
        fontWeight: "700",
    },
});