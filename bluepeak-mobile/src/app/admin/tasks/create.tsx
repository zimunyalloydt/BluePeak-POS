import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Check,
    ChevronDown,
    Users,
} from "lucide-react-native";

import api from "../../../services/api";

interface User {
    userId: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
}

const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

export default function CreateTask() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Normal");
    const [dueDate, setDueDate] = useState("");

    const [assignToAll, setAssignToAll] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    const [loadingUsers, setLoadingUsers] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPriorities, setShowPriorities] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get<User[]>("/admin/users");

            setUsers(
                response.data.filter(
                    (user) => user.isActive
                )
            );
        } catch (error: any) {
            console.log(
                "Failed to load users:",
                error?.response?.data || error?.message
            );

            Alert.alert(
                "Error",
                "Unable to load staff members."
            );
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUser = (userId: number) => {
        setSelectedUsers((current) => {
            if (current.includes(userId)) {
                return current.filter(
                    (id) => id !== userId
                );
            }

            return [...current, userId];
        });
    };

    const selectedCount = useMemo(
        () => selectedUsers.length,
        [selectedUsers]
    );

    const validate = () => {
        if (!title.trim()) {
            Alert.alert(
                "Missing title",
                "Please enter a task title."
            );
            return false;
        }

        if (!description.trim()) {
            Alert.alert(
                "Missing description",
                "Please enter a task description."
            );
            return false;
        }

        if (!assignToAll && selectedUsers.length === 0) {
            Alert.alert(
                "No staff selected",
                "Select at least one staff member or enable Assign to all."
            );
            return false;
        }

        if (dueDate.trim()) {
            const parsedDate = new Date(dueDate);

            if (Number.isNaN(parsedDate.getTime())) {
                Alert.alert(
                    "Invalid date",
                    "Please enter a valid date such as 2026-09-20."
                );
                return false;
            }
        }

        return true;
    };

    const createTask = async () => {
        if (!validate()) return;

        setSaving(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                priority,
                dueDate: dueDate.trim()
                    ? new Date(dueDate).toISOString()
                    : null,
                assignToAll,
                userIds: assignToAll
                    ? []
                    : selectedUsers,
            };

            await api.post("/Tasks", payload);

            Alert.alert(
                "Task created",
                assignToAll
                    ? "The task has been assigned to all active users."
                    : `The task has been assigned to ${selectedCount} staff member${
                          selectedCount === 1 ? "" : "s"
                      }.`,
                [
                    {
                        text: "OK",
                        onPress: () =>
                            router.replace("/admin/tasks"),
                    },
                ]
            );
        } catch (error: any) {
            console.log(
                "Create task error:",
                error?.response?.data || error?.message
            );

            const message =
                typeof error?.response?.data === "string"
                    ? error.response.data
                    : "Unable to create the task. Please try again.";

            Alert.alert("Create Task Failed", message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft
                            size={22}
                            color="#111827"
                        />
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>
                            Create Task
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            Assign work to your staff
                        </Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionTitle}>
                        Task Details
                    </Text>

                    <Text style={styles.label}>
                        Task Title
                    </Text>

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g. Check stock levels"
                        placeholderTextColor="#94a3b8"
                        style={styles.input}
                    />

                    <Text style={styles.label}>
                        Description
                    </Text>

                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe what needs to be done..."
                        placeholderTextColor="#94a3b8"
                        style={[
                            styles.input,
                            styles.textArea,
                        ]}
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>
                        Priority
                    </Text>

                    <TouchableOpacity
                        style={styles.select}
                        onPress={() =>
                            setShowPriorities(
                                !showPriorities
                            )
                        }
                    >
                        <Text style={styles.selectText}>
                            {priority}
                        </Text>

                        <ChevronDown
                            size={20}
                            color="#64748b"
                        />
                    </TouchableOpacity>

                    {showPriorities && (
                        <View style={styles.dropdown}>
                            {PRIORITIES.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setPriority(item);
                                        setShowPriorities(
                                            false
                                        );
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownText,
                                            item === priority &&
                                                styles.selectedDropdownText,
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                    {item === priority && (
                                        <Check
                                            size={18}
                                            color="#111827"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text style={styles.label}>
                        Due Date
                    </Text>

                    <View style={styles.dateContainer}>
                        <Calendar
                            size={19}
                            color="#64748b"
                        />

                        <TextInput
                            value={dueDate}
                            onChangeText={setDueDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94a3b8"
                            style={styles.dateInput}
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.dateHint}>
                        Leave blank if the task has no deadline.
                    </Text>

                    <View style={styles.assignmentHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>
                                Assignment
                            </Text>

                            <Text style={styles.sectionSubtitle}>
                                Choose who should receive this task.
                            </Text>
                        </View>

                        <Users
                            size={22}
                            color="#64748b"
                        />
                    </View>

                    <View style={styles.assignAllCard}>
                        <View style={styles.assignAllText}>
                            <Text style={styles.assignAllTitle}>
                                Assign to all active users
                            </Text>

                            <Text style={styles.assignAllSubtitle}>
                                Everyone currently active will receive
                                this task.
                            </Text>
                        </View>

                        <Switch
                            value={assignToAll}
                            onValueChange={(value) => {
                                setAssignToAll(value);

                                if (value) {
                                    setSelectedUsers([]);
                                }
                            }}
                            trackColor={{
                                false: "#cbd5e1",
                                true: "#94a3b8",
                            }}
                            thumbColor={
                                assignToAll
                                    ? "#111827"
                                    : "#f8fafc"
                            }
                        />
                    </View>

                    {!assignToAll && (
                        <>
                            <View style={styles.selectedHeader}>
                                <Text style={styles.label}>
                                    Select Staff
                                </Text>

                                <Text
                                    style={
                                        styles.selectedCount
                                    }
                                >
                                    {selectedCount} selected
                                </Text>
                            </View>

                            {loadingUsers ? (
                                <View
                                    style={
                                        styles.usersLoading
                                    }
                                >
                                    <ActivityIndicator
                                        color="#111827"
                                    />

                                    <Text
                                        style={
                                            styles.loadingText
                                        }
                                    >
                                        Loading staff...
                                    </Text>
                                </View>
                            ) : users.length === 0 ? (
                                <View
                                    style={
                                        styles.noUsers
                                    }
                                >
                                    <Text
                                        style={
                                            styles.noUsersText
                                        }
                                    >
                                        No active users found.
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={
                                        styles.usersList
                                    }
                                >
                                    {users.map((user) => {
                                        const selected =
                                            selectedUsers.includes(
                                                user.userId
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={
                                                    user.userId
                                                }
                                                activeOpacity={
                                                    0.8
                                                }
                                                style={[
                                                    styles.userCard,
                                                    selected &&
                                                        styles.userCardSelected,
                                                ]}
                                                onPress={() =>
                                                    toggleUser(
                                                        user.userId
                                                    )
                                                }
                                            >
                                                <View
                                                    style={[
                                                        styles.avatar,
                                                        selected &&
                                                            styles.avatarSelected,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.avatarText,
                                                            selected &&
                                                                styles.avatarTextSelected,
                                                        ]}
                                                    >
                                                        {(
                                                            user.firstName?.[0] ||
                                                            ""
                                                        ).toUpperCase()}
                                                        {(
                                                            user.lastName?.[0] ||
                                                            ""
                                                        ).toUpperCase()}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.userInfo
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.userName
                                                        }
                                                    >
                                                        {
                                                            user.firstName
                                                        }{" "}
                                                        {
                                                            user.lastName
                                                        }
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.userUsername
                                                        }
                                                    >
                                                        @
                                                        {
                                                            user.username
                                                        }{" "}
                                                        •{" "}
                                                        {
                                                            user.role
                                                        }
                                                    </Text>
                                                </View>

                                                <View
                                                    style={[
                                                        styles.checkbox,
                                                        selected &&
                                                            styles.checkboxSelected,
                                                    ]}
                                                >
                                                    {selected && (
                                                        <Check
                                                            size={
                                                                15
                                                            }
                                                            color="#ffffff"
                                                        />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            saving &&
                                styles.createButtonDisabled,
                        ]}
                        onPress={createTask}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator
                                color="#ffffff"
                            />
                        ) : (
                            <Text
                                style={
                                    styles.createButtonText
                                }
                            >
                                Create Task
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.bottomSpace} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },

    keyboard: {
        flex: 1,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 16,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
    },

    headerText: {
        flex: 1,
        marginLeft: 12,
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0f172a",
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 13,
        color: "#64748b",
    },

    content: {
        padding: 18,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 14,
    },

    sectionSubtitle: {
        marginTop: -8,
        marginBottom: 14,
        fontSize: 13,
        color: "#64748b",
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 7,
    },

    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#dbe3ed",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#0f172a",
        marginBottom: 16,
    },

    textArea: {
        height: 110,
        paddingTop: 13,
        paddingBottom: 13,
    },

    select: {
        height: 50,
        borderWidth: 1,
        borderColor: "#dbe3ed",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    selectText: {
        fontSize: 15,
        color: "#0f172a",
    },

    dropdown: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#dbe3ed",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
    },

    dropdownItem: {
        minHeight: 46,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },

    dropdownText: {
        fontSize: 14,
        color: "#475569",
    },

    selectedDropdownText: {
        fontWeight: "800",
        color: "#111827",
    },

    dateContainer: {
        height: 50,
        borderWidth: 1,
        borderColor: "#dbe3ed",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
    },

    dateInput: {
        flex: 1,
        marginLeft: 9,
        fontSize: 15,
        color: "#0f172a",
    },

    dateHint: {
        marginTop: 6,
        marginBottom: 22,
        fontSize: 12,
        color: "#94a3b8",
    },

    assignmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },

    assignAllCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#dbe3ed",
        borderRadius: 14,
        padding: 15,
        marginBottom: 18,
    },

    assignAllText: {
        flex: 1,
        paddingRight: 10,
    },

    assignAllTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0f172a",
    },

    assignAllSubtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 17,
        color: "#64748b",
    },

    selectedHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    selectedCount: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 7,
    },

    usersList: {
        gap: 8,
    },

    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 14,
        padding: 12,
    },

    userCardSelected: {
        borderColor: "#111827",
        backgroundColor: "#f8fafc",
    },

    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e2e8f0",
    },

    avatarSelected: {
        backgroundColor: "#111827",
    },

    avatarText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#475569",
    },

    avatarTextSelected: {
        color: "#ffffff",
    },

    userInfo: {
        flex: 1,
        marginLeft: 11,
    },

    userName: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0f172a",
    },

    userUsername: {
        marginTop: 3,
        fontSize: 12,
        color: "#64748b",
    },

    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: "#cbd5e1",
        alignItems: "center",
        justifyContent: "center",
    },

    checkboxSelected: {
        borderColor: "#111827",
        backgroundColor: "#111827",
    },

    usersLoading: {
        paddingVertical: 30,
        alignItems: "center",
    },

    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: "#64748b",
    },

    noUsers: {
        padding: 20,
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 14,
    },

    noUsersText: {
        fontSize: 13,
        color: "#64748b",
    },

    createButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#111827",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },

    createButtonDisabled: {
        opacity: 0.6,
    },

    createButtonText: {
        fontSize: 15,
        fontWeight: "800",
        color: "#ffffff",
    },

    bottomSpace: {
        height: 30,
    },
});