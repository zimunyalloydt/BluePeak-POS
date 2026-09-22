import React, {
    useCallback,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import {
    createAdminUser,
    getAdminUsers,
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

const ROLES = [
    {
        id: 1,
        name: "Admin",
    },
    {
        id: 2,
        name: "Manager",
    },
    {
        id: 3,
        name: "Cashier",
    },
];

export default function StaffManagement() {
    const router = useRouter();

    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState(3);

    const loadStaff = useCallback(async () => {
        try {
            const data = await getAdminUsers();

            setStaff(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error(
                "Staff error:",
                error
            );

            const message =
                error?.response?.data?.message ||
                "Failed to load staff.";

            Alert.alert(
                "Staff Error",
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
                    await loadStaff();
                }
            };

            run();

            return () => {
                cancelled = true;
            };
        }, [loadStaff])
    );

    const refresh = async () => {
        setRefreshing(true);
        await loadStaff();
    };

    const filteredStaff = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return staff.filter((person) => {
            const matchesSearch =
                !query ||
                `${person.firstName} ${person.lastName}`
                    .toLowerCase()
                    .includes(query) ||
                person.username
                    ?.toLowerCase()
                    .includes(query) ||
                person.email
                    ?.toLowerCase()
                    .includes(query) ||
                String(person.userId).includes(query);

            const matchesRole =
                filter === "All" ||
                person.role?.toLowerCase() ===
                    filter.toLowerCase();

            return (
                matchesSearch &&
                matchesRole
            );
        });
    }, [staff, search, filter]);

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmail("");
        setPhone("");
        setPassword("");
        setRoleId(3);
    };

    const handleCreateStaff = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !username.trim() ||
            !email.trim() ||
            !password.trim()
        ) {
            Alert.alert(
                "Missing Information",
                "Please complete all required fields."
            );

            return;
        }

        try {
            setCreating(true);

            await createAdminUser({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                roleId,
                isActive: true,
            });

            Alert.alert(
                "Staff Created",
                "The staff account has been created successfully."
            );

            resetForm();
            setShowCreate(false);

            await loadStaff();
        } catch (error: any) {
            console.error(
                "Create staff error:",
                error
            );

            const message =
                error?.response?.data?.message ||
                "Failed to create staff account.";

            Alert.alert(
                "Create Staff",
                String(message)
            );
        } finally {
            setCreating(false);
        }
    };

    const getInitials = (
        firstName: string,
        lastName: string
    ) => {
        return (
            `${firstName?.charAt(0) || ""}${
                lastName?.charAt(0) || ""
            }`
        ).toUpperCase();
    };

    const renderStaff = ({
        item,
    }: {
        item: Staff;
    }) => {
        return (
            <Pressable
                style={styles.staffCard}
             onPress={() =>
    router.push({
        pathname: "/admin/staff-details",
        params: {
            userId: item.userId.toString(),
        },
    })
}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {getInitials(
                            item.firstName,
                            item.lastName
                        )}
                    </Text>
                </View>

                <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>
                        {item.firstName}{" "}
                        {item.lastName}
                    </Text>

                    <Text style={styles.username}>
                        @{item.username}
                    </Text>

                    <Text
                        style={styles.email}
                        numberOfLines={1}
                    >
                        {item.email}
                    </Text>

                    <View style={styles.badges}>
                        <View style={styles.roleBadge}>
                            <Text
                                style={
                                    styles.roleBadgeText
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

                <Text style={styles.arrow}>
                    ›
                </Text>
            </Pressable>
        );
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.loadingScreen}
            >
                <ActivityIndicator size="large" />

                <Text
                    style={styles.loadingText}
                >
                    Loading staff...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
        >
            <View style={styles.header}>
                <View>
                    <Pressable
                        onPress={() =>
                            router.back()
                        }
                    >
                        <Text
                            style={styles.back}
                        >
                            ‹ Back
                        </Text>
                    </Pressable>

                    <Text
                        style={styles.title}
                    >
                        Staff Management
                    </Text>

                    <Text
                        style={styles.subtitle}
                    >
                        Manage your BluePeak team
                    </Text>
                </View>

                <Pressable
                    style={styles.addButton}
                    onPress={() =>
                        setShowCreate(true)
                    }
                >
                    <Text
                        style={styles.addButtonText}
                    >
                        + Add
                    </Text>
                </Pressable>
            </View>

            {/* SEARCH */}

            <View
                style={styles.searchContainer}
            >
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search staff..."
                    placeholderTextColor="#9AA3AF"
                    style={styles.searchInput}
                />
            </View>

            {/* FILTERS */}

            <View style={styles.filters}>
                {[
                    "All",
                    "Admin",
                    "Manager",
                    "Cashier",
                ].map((item) => (
                    <Pressable
                        key={item}
                        onPress={() =>
                            setFilter(item)
                        }
                        style={[
                            styles.filterButton,
                            filter === item &&
                                styles.filterActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === item &&
                                    styles.filterTextActive,
                            ]}
                        >
                            {item}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* SUMMARY */}

            <View style={styles.summary}>
                <Text style={styles.summaryTitle}>
                    {filteredStaff.length}{" "}
                    {filteredStaff.length === 1
                        ? "staff member"
                        : "staff members"}
                </Text>

                <Text style={styles.summaryActive}>
                    {
                        staff.filter(
                            (person) =>
                                person.isActive
                        ).length
                    } active
                </Text>
            </View>

            {/* LIST */}

            <FlatList
                data={filteredStaff}
                keyExtractor={(item) =>
                    String(item.userId)
                }
                renderItem={renderStaff}
                contentContainerStyle={
                    styles.list
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                    />
                }
                ListEmptyComponent={
                    <View
                        style={
                            styles.empty
                        }
                    >
                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No staff found
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Try changing your
                            search or filter.
                        </Text>
                    </View>
                }
            />

            {/* CREATE MODAL */}

            <Modal
                visible={showCreate}
                animationType="slide"
                transparent
                onRequestClose={() =>
                    setShowCreate(false)
                }
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={
                        Platform.OS === "ios"
                            ? "padding"
                            : undefined
                    }
                >
                    <View
                        style={styles.modal}
                    >
                        <View
                            style={
                                styles.modalHeader
                            }
                        >
                            <View>
                                <Text
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Add Staff
                                </Text>

                                <Text
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Create a new
                                    BluePeak account
                                </Text>
                            </View>

                            <Pressable
                                onPress={() =>
                                    setShowCreate(
                                        false
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.close
                                    }
                                >
                                    ×
                                </Text>
                            </Pressable>
                        </View>

                        <FlatList
                            data={[1]}
                            renderItem={() => (
                                <View>
                                    <TextInput
                                        placeholder="First name *"
                                        placeholderTextColor="#9AA3AF"
                                        value={
                                            firstName
                                        }
                                        onChangeText={
                                            setFirstName
                                        }
                                        style={
                                            styles.input
                                        }
                                    />

                                    <TextInput
                                        placeholder="Last name *"
                                        placeholderTextColor="#9AA3AF"
                                        value={
                                            lastName
                                        }
                                        onChangeText={
                                            setLastName
                                        }
                                        style={
                                            styles.input
                                        }
                                    />

                                    <TextInput
                                        placeholder="Username *"
                                        placeholderTextColor="#9AA3AF"
                                        value={
                                            username
                                        }
                                        onChangeText={
                                            setUsername
                                        }
                                        autoCapitalize="none"
                                        style={
                                            styles.input
                                        }
                                    />

                                    <TextInput
                                        placeholder="Email *"
                                        placeholderTextColor="#9AA3AF"
                                        value={email}
                                        onChangeText={
                                            setEmail
                                        }
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        style={
                                            styles.input
                                        }
                                    />

                                    <TextInput
                                        placeholder="Phone"
                                        placeholderTextColor="#9AA3AF"
                                        value={phone}
                                        onChangeText={
                                            setPhone
                                        }
                                        keyboardType="phone-pad"
                                        style={
                                            styles.input
                                        }
                                    />

                                    <TextInput
                                        placeholder="Password *"
                                        placeholderTextColor="#9AA3AF"
                                        value={
                                            password
                                        }
                                        onChangeText={
                                            setPassword
                                        }
                                        secureTextEntry
                                        style={
                                            styles.input
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.roleLabel
                                        }
                                    >
                                        Role
                                    </Text>

                                    <View
                                        style={
                                            styles.roleOptions
                                        }
                                    >
                                        {ROLES.map(
                                            (
                                                role
                                            ) => (
                                                <Pressable
                                                    key={
                                                        role.id
                                                    }
                                                    onPress={() =>
                                                        setRoleId(
                                                            role.id
                                                        )
                                                    }
                                                    style={[
                                                        styles.roleOption,
                                                        roleId ===
                                                            role.id &&
                                                            styles.roleOptionActive,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.roleOptionText,
                                                            roleId ===
                                                                role.id &&
                                                                styles.roleOptionTextActive,
                                                        ]}
                                                    >
                                                        {
                                                            role.name
                                                        }
                                                    </Text>
                                                </Pressable>
                                            )
                                        )}
                                    </View>

                                    <Pressable
                                        style={[
                                            styles.createButton,
                                            creating &&
                                                styles.disabledButton,
                                        ]}
                                        disabled={
                                            creating
                                        }
                                        onPress={
                                            handleCreateStaff
                                        }
                                    >
                                        {creating ? (
                                            <ActivityIndicator
                                                color="#FFFFFF"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    styles.createButtonText
                                                }
                                            >
                                                Create Staff
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            )}
                            keyExtractor={() =>
                                "form"
                            }
                            contentContainerStyle={
                                styles.form
                            }
                            showsVerticalScrollIndicator={
                                false
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
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
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },

    back: {
        color: "#1769E0",
        fontWeight: "700",
        fontSize: 13,
        marginBottom: 8,
    },

    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#172033",
    },

    subtitle: {
        marginTop: 3,
        color: "#7B8492",
        fontSize: 12,
    },

    addButton: {
        backgroundColor: "#1769E0",
        paddingHorizontal: 15,
        paddingVertical: 11,
        borderRadius: 10,
    },

    addButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    searchContainer: {
        marginHorizontal: 18,
        marginTop: 4,
    },

    searchInput: {
        height: 46,
        backgroundColor: "#FFFFFF",
        borderRadius: 11,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#E1E5EA",
        color: "#172033",
    },

    filters: {
        flexDirection: "row",
        paddingHorizontal: 18,
        marginTop: 12,
        gap: 7,
    },

    filterButton: {
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E5EA",
    },

    filterActive: {
        backgroundColor: "#1769E0",
        borderColor: "#1769E0",
    },

    filterText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6B7280",
    },

    filterTextActive: {
        color: "#FFFFFF",
    },

    summary: {
        marginHorizontal: 18,
        marginTop: 18,
        marginBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    summaryTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#172033",
    },

    summaryActive: {
        fontSize: 12,
        color: "#1C9B62",
        fontWeight: "700",
    },

    list: {
        paddingHorizontal: 18,
        paddingBottom: 30,
    },

    staffCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E5EA",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EAF1FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    avatarText: {
        color: "#1769E0",
        fontSize: 15,
        fontWeight: "900",
    },

    staffInfo: {
        flex: 1,
    },

    staffName: {
        color: "#172033",
        fontSize: 15,
        fontWeight: "800",
    },

    username: {
        color: "#1769E0",
        fontSize: 11,
        marginTop: 2,
    },

    email: {
        color: "#7B8492",
        fontSize: 11,
        marginTop: 3,
    },

    badges: {
        flexDirection: "row",
        gap: 6,
        marginTop: 8,
    },

    roleBadge: {
        backgroundColor: "#EEF2F7",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    roleBadgeText: {
        color: "#425066",
        fontSize: 9,
        fontWeight: "800",
    },

    statusBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    activeBadge: {
        backgroundColor: "#E8F7EF",
    },

    inactiveBadge: {
        backgroundColor: "#FDECEC",
    },

    statusText: {
        fontSize: 9,
        fontWeight: "800",
    },

    activeText: {
        color: "#1C9B62",
    },

    inactiveText: {
        color: "#D64545",
    },

    arrow: {
        color: "#A0A8B4",
        fontSize: 28,
        marginLeft: 8,
    },

    empty: {
        alignItems: "center",
        paddingTop: 70,
    },

    emptyTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#172033",
    },

    emptyText: {
        color: "#7B8492",
        fontSize: 12,
        marginTop: 5,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.45)",
    },

    modal: {
        backgroundColor: "#F5F7FA",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "92%",
    },

    modalHeader: {
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E1E5EA",
    },

    modalTitle: {
        color: "#172033",
        fontSize: 20,
        fontWeight: "900",
    },

    modalSubtitle: {
        color: "#7B8492",
        fontSize: 11,
        marginTop: 3,
    },

    close: {
        fontSize: 30,
        color: "#7B8492",
        lineHeight: 30,
    },

    form: {
        padding: 20,
        paddingBottom: 40,
    },

    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E5EA",
        borderRadius: 10,
        height: 46,
        paddingHorizontal: 13,
        color: "#172033",
        marginBottom: 10,
    },

    roleLabel: {
        color: "#172033",
        fontSize: 12,
        fontWeight: "800",
        marginTop: 5,
        marginBottom: 8,
    },

    roleOptions: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },

    roleOption: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E1E5EA",
        borderRadius: 9,
        paddingVertical: 11,
        alignItems: "center",
    },

    roleOptionActive: {
        backgroundColor: "#1769E0",
        borderColor: "#1769E0",
    },

    roleOptionText: {
        color: "#6B7280",
        fontSize: 11,
        fontWeight: "800",
    },

    roleOptionTextActive: {
        color: "#FFFFFF",
    },

    createButton: {
        height: 48,
        backgroundColor: "#1769E0",
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },

    disabledButton: {
        opacity: 0.6,
    },

    createButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "900",
    },
});