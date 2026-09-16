import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock3,
    Plus,
    Search,
    Users,
} from "lucide-react-native";

import api from "../../services/api";

interface Task {
    taskItemId: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    createdAt: string;
    dueDate?: string | null;
    assignedUsers: string[];
    totalAssigned: number;
    completedAssignments: number;
    remainingAssignments: number;
}

type Filter = "All" | "Pending" | "Completed";

export default function AdminTasks() {
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("All");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTasks = async () => {
        try {
            const response = await api.get<Task[]>("/Tasks");
            setTasks(response.data);
        } catch (error: any) {
            console.log(
                "Failed to load tasks:",
                error?.response?.data || error?.message
            );

            Alert.alert(
                "Error",
                "Unable to load tasks. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks();
    };

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter((task) => {
            const matchesSearch =
                !query ||
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.priority.toLowerCase().includes(query) ||
                task.assignedUsers.some((user) =>
                    user.toLowerCase().includes(query)
                );

            const matchesFilter =
                filter === "All" ||
                task.status.toLowerCase() === filter.toLowerCase();

            return matchesSearch && matchesFilter;
        });
    }, [tasks, search, filter]);

    const getPriorityStyle = (priority: string) => {
        switch (priority.toLowerCase()) {
            case "high":
                return styles.priorityHigh;

            case "urgent":
                return styles.priorityUrgent;

            case "low":
                return styles.priorityLow;

            default:
                return styles.priorityNormal;
        }
    };

    const getStatusStyle = (status: string) => {
        return status.toLowerCase() === "completed"
            ? styles.statusCompleted
            : styles.statusPending;
    };

    const formatDate = (date?: string | null) => {
        if (!date) return "No due date";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "No due date";
        }

        return parsed.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getProgressPercentage = (task: Task) => {
        if (!task.totalAssigned) return 0;

        return Math.round(
            (task.completedAssignments / task.totalAssigned) * 100
        );
    };

    const renderTask = ({ item }: { item: Task }) => {
        const progress = getProgressPercentage(item);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() =>
                    Alert.alert(
                        item.title,
                        `${item.description || "No description"}\n\nAssigned: ${
                            item.totalAssigned
                        }\nCompleted: ${
                            item.completedAssignments
                        }\nRemaining: ${
                            item.remainingAssignments
                        }`
                    )
                }
            >
                <View style={styles.cardTop}>
                    <View style={styles.titleContainer}>
                        <Text
                            style={styles.taskTitle}
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>

                        <Text
                            style={styles.description}
                            numberOfLines={2}
                        >
                            {item.description || "No description"}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.priorityBadge,
                            getPriorityStyle(item.priority),
                        ]}
                    >
                        <Text style={styles.priorityText}>
                            {item.priority}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Users size={16} color="#64748b" />

                        <Text style={styles.infoText}>
                            {item.totalAssigned}{" "}
                            {item.totalAssigned === 1
                                ? "person"
                                : "people"}
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Calendar size={16} color="#64748b" />

                        <Text style={styles.infoText}>
                            {formatDate(item.dueDate)}
                        </Text>
                    </View>
                </View>

                <View style={styles.assignees}>
                    <Text style={styles.assignedLabel}>
                        Assigned to
                    </Text>

                    <Text
                        style={styles.assignedUsers}
                        numberOfLines={2}
                    >
                        {item.assignedUsers.length
                            ? item.assignedUsers.join(", ")
                            : "No users assigned"}
                    </Text>
                </View>

                <View style={styles.progressHeader}>
                    <View style={styles.infoItem}>
                        {item.status.toLowerCase() === "completed" ? (
                            <CheckCircle2
                                size={16}
                                color="#16a34a"
                            />
                        ) : (
                            <Clock3
                                size={16}
                                color="#d97706"
                            />
                        )}

                        <Text style={styles.progressText}>
                            {item.completedAssignments}/
                            {item.totalAssigned} completed
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            getStatusStyle(item.status),
                        ]}
                    >
                        <Text style={styles.statusText}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${progress}%`,
                            },
                        ]}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingScreen}>
                <ActivityIndicator
                    size="large"
                    color="#111827"
                />

                <Text style={styles.loadingText}>
                    Loading tasks...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        Tasks
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Manage staff tasks
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                        router.push("/admin/tasks/create")
                    }
                >
                    <Plus
                        size={21}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>
                            {tasks.length}
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Total
                        </Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>
                            {
                                tasks.filter(
                                    (task) =>
                                        task.status.toLowerCase() ===
                                        "pending"
                                ).length
                            }
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Pending
                        </Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryNumber}>
                            {
                                tasks.filter(
                                    (task) =>
                                        task.status.toLowerCase() ===
                                        "completed"
                                ).length
                            }
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Completed
                        </Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Search
                        size={19}
                        color="#64748b"
                    />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search tasks..."
                        placeholderTextColor="#94a3b8"
                        style={styles.searchInput}
                    />
                </View>

                <View style={styles.filters}>
                    {(
                        [
                            "All",
                            "Pending",
                            "Completed",
                        ] as Filter[]
                    ).map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.filterButton,
                                filter === item &&
                                    styles.filterButtonActive,
                            ]}
                            onPress={() => setFilter(item)}
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
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) =>
                        item.taskItemId.toString()
                    }
                    renderItem={renderTask}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={
                        filteredTasks.length === 0
                            ? styles.emptyContainer
                            : styles.list
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <CheckCircle2
                                size={48}
                                color="#cbd5e1"
                            />

                            <Text style={styles.emptyTitle}>
                                No tasks found
                            </Text>

                            <Text style={styles.emptyText}>
                                {search
                                    ? "Try a different search."
                                    : "Create a task to get started."}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },

    loadingScreen: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },

    loadingText: {
        marginTop: 12,
        color: "#64748b",
        fontSize: 15,
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

    headerTitleContainer: {
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

    addButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111827",
    },

    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
    },

    summaryRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },

    summaryCard: {
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },

    summaryNumber: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0f172a",
    },

    summaryLabel: {
        marginTop: 3,
        fontSize: 12,
        color: "#64748b",
    },

    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 13,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 12,
    },

    searchInput: {
        flex: 1,
        marginLeft: 9,
        fontSize: 15,
        color: "#0f172a",
    },

    filters: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },

    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: "#e2e8f0",
    },

    filterButtonActive: {
        backgroundColor: "#111827",
    },

    filterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
    },

    filterTextActive: {
        color: "#ffffff",
    },

    list: {
        paddingBottom: 30,
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },

    cardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    titleContainer: {
        flex: 1,
        paddingRight: 10,
    },

    taskTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#0f172a",
    },

    description: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 19,
        color: "#64748b",
    },

    priorityBadge: {
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    priorityNormal: {
        backgroundColor: "#e2e8f0",
    },

    priorityLow: {
        backgroundColor: "#dcfce7",
    },

    priorityHigh: {
        backgroundColor: "#fef3c7",
    },

    priorityUrgent: {
        backgroundColor: "#fee2e2",
    },

    priorityText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#334155",
    },

    divider: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 14,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    infoText: {
        fontSize: 12,
        color: "#64748b",
    },

    assignees: {
        marginTop: 13,
    },

    assignedLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94a3b8",
        textTransform: "uppercase",
    },

    assignedUsers: {
        marginTop: 4,
        fontSize: 13,
        color: "#334155",
        lineHeight: 19,
    },

    progressHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 15,
    },

    progressText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
    },

    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    statusPending: {
        backgroundColor: "#fef3c7",
    },

    statusCompleted: {
        backgroundColor: "#dcfce7",
    },

    statusText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#334155",
    },

    progressTrack: {
        height: 6,
        borderRadius: 6,
        backgroundColor: "#e2e8f0",
        overflow: "hidden",
        marginTop: 9,
    },

    progressBar: {
        height: "100%",
        backgroundColor: "#16a34a",
        borderRadius: 6,
    },

    emptyContainer: {
        flexGrow: 1,
        justifyContent: "center",
    },

    emptyState: {
        alignItems: "center",
        paddingHorizontal: 30,
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: "800",
        color: "#334155",
    },

    emptyText: {
        marginTop: 6,
        textAlign: "center",
        fontSize: 14,
        color: "#94a3b8",
    },
});