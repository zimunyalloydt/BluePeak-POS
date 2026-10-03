import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock3,
    History,
    RefreshCcw,
    XCircle,
} from "lucide-react-native";

import { router } from "expo-router";

import {
    approveRefund,
    getPendingRefunds,
    getRefundHistory,
    RefundHistory,
    RefundRequest,
    rejectRefund,
} from "../../services/refundService";

type Tab = "pending" | "history";

function formatCurrency(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

export default function AdminRefundsScreen() {
    const [tab, setTab] =
        useState<Tab>("pending");

    const [pending, setPending] = useState<
        RefundRequest[]
    >([]);

    const [history, setHistory] = useState<
        RefundHistory[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const loadData = useCallback(
        async () => {
            try {
                const [
                    pendingData,
                    historyData,
                ] = await Promise.all([
                    getPendingRefunds(),
                    getRefundHistory(),
                ]);

                setPending(pendingData);
                setHistory(historyData);
            } catch (error: any) {
                console.error(
                    "Failed to load refunds:",
                    error
                );

                Alert.alert(
                    "Error",
                    "Failed to load refund data."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleApprove = (
        refundRequestId: number
    ) => {
        Alert.alert(
            "Approve Refund",
            "Are you sure you want to approve this refund? Stock will be restored.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Approve",
                    onPress: async () => {
                        try {
                            await approveRefund(
                                refundRequestId
                            );

                            Alert.alert(
                                "Refund Approved",
                                "The refund has been approved successfully."
                            );

                            await loadData();
                        } catch (error: any) {
                            console.error(
                                "Approve refund error:",
                                error
                            );

                            Alert.alert(
                                "Error",
                                error?.response?.data
                                    ?.message ||
                                    "Failed to approve refund."
                            );
                        }
                    },
                },
            ]
        );
    };

    const handleReject = (
        refundRequestId: number
    ) => {
        Alert.alert(
            "Reject Refund",
            "Are you sure you want to reject this refund request?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await rejectRefund(
                                refundRequestId
                            );

                            Alert.alert(
                                "Refund Rejected",
                                "The refund request has been rejected."
                            );

                            await loadData();
                        } catch (error: any) {
                            console.error(
                                "Reject refund error:",
                                error
                            );

                            Alert.alert(
                                "Error",
                                error?.response?.data
                                    ?.message ||
                                    "Failed to reject refund."
                            );
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.loadingContainer}
            >
                <ActivityIndicator
                    size="large"
                    color="#1769E0"
                />

                <Text style={styles.loadingText}>
                    Loading refunds...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={
                    styles.content
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1769E0"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ArrowLeft
                            size={22}
                            color="#111827"
                        />
                    </Pressable>

                    <View>
                        <Text style={styles.title}>
                            Refunds
                        </Text>

                        <Text
                            style={styles.subtitle}
                        >
                            Review and manage refund requests
                        </Text>
                    </View>
                </View>

                <View style={styles.tabs}>
                    <Pressable
                        onPress={() =>
                            setTab("pending")
                        }
                        style={[
                            styles.tab,
                            tab === "pending" &&
                                styles.tabActive,
                        ]}
                    >
                        <Clock3
                            size={17}
                            color={
                                tab === "pending"
                                    ? "#FFFFFF"
                                    : "#64748B"
                            }
                        />

                        <Text
                            style={[
                                styles.tabText,
                                tab === "pending" &&
                                    styles.tabTextActive,
                            ]}
                        >
                            Pending
                        </Text>

                        {pending.length > 0 && (
                            <View
                                style={[
                                    styles.countBadge,
                                    tab ===
                                        "pending" &&
                                        styles.countBadgeActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.countText,
                                        tab ===
                                            "pending" &&
                                            styles.countTextActive,
                                    ]}
                                >
                                    {pending.length}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() =>
                            setTab("history")
                        }
                        style={[
                            styles.tab,
                            tab === "history" &&
                                styles.tabActive,
                        ]}
                    >
                        <History
                            size={17}
                            color={
                                tab === "history"
                                    ? "#FFFFFF"
                                    : "#64748B"
                            }
                        />

                        <Text
                            style={[
                                styles.tabText,
                                tab === "history" &&
                                    styles.tabTextActive,
                            ]}
                        >
                            History
                        </Text>
                    </Pressable>
                </View>

                {tab === "pending" ? (
                    <>
                        <View
                            style={styles.sectionHeader}
                        >
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Pending Requests
                            </Text>

                            <Text
                                style={
                                    styles.resultCount
                                }
                            >
                                {pending.length}{" "}
                                {pending.length === 1
                                    ? "request"
                                    : "requests"}
                            </Text>
                        </View>

                        {pending.length === 0 ? (
                            <View
                                style={
                                    styles.emptyCard
                                }
                            >
                                <CheckCircle2
                                    size={44}
                                    color="#16A34A"
                                />

                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    No pending refunds
                                </Text>

                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    New refund requests
                                    from cashiers will
                                    appear here.
                                </Text>
                            </View>
                        ) : (
                            pending.map(
                                (refund) => (
                                    <Pressable
                                        key={
                                            refund.refundRequestId
                                        }
                                        onPress={() =>
                                            router.push(
                                                `/admin/refunds/${refund.refundRequestId}`
                                            )
                                        }
                                        style={({ pressed }) => [
                                            styles.card,
                                            pressed &&
                                                styles.cardPressed,
                                        ]}
                                    >
                                        <View
                                            style={
                                                styles.cardTop
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.iconBox
                                                }
                                            >
                                                <RefreshCcw
                                                    size={
                                                        20
                                                    }
                                                    color="#DC2626"
                                                />
                                            </View>

                                            <View
                                                style={
                                                    styles.cardMain
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.cardTitle
                                                    }
                                                >
                                                    Refund Request #
                                                    {
                                                        refund.refundRequestId
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.saleText
                                                    }
                                                >
                                                    Sale #
                                                    {
                                                        refund.saleId
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.cashier
                                                    }
                                                >
                                                    {
                                                        refund.cashier
                                                    }
                                                </Text>
                                            </View>

                                            <ChevronRight
                                                size={
                                                    21
                                                }
                                                color="#94A3B8"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.reasonLabel
                                            }
                                        >
                                            REASON
                                        </Text>

                                        <Text
                                            style={
                                                styles.reason
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {
                                                refund.reason
                                            }
                                        </Text>

                                        <View
                                            style={
                                                styles.cardBottom
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.date
                                                }
                                            >
                                                {formatDate(
                                                    refund.requestedAt
                                                )}
                                            </Text>

                                            <View
                                                style={
                                                    styles.pendingBadge
                                                }
                                            >
                                                <Clock3
                                                    size={
                                                        13
                                                    }
                                                    color="#92400E"
                                                />

                                                <Text
                                                    style={
                                                        styles.pendingText
                                                    }
                                                >
                                                    Pending
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.actions
                                            }
                                        >
                                            <Pressable
                                                onPress={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    handleReject(
                                                        refund.refundRequestId
                                                    );
                                                }}
                                                style={
                                                    styles.rejectButton
                                                }
                                            >
                                                <XCircle
                                                    size={
                                                        17
                                                    }
                                                    color="#DC2626"
                                                />

                                                <Text
                                                    style={
                                                        styles.rejectText
                                                    }
                                                >
                                                    Reject
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                onPress={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    handleApprove(
                                                        refund.refundRequestId
                                                    );
                                                }}
                                                style={
                                                    styles.approveButton
                                                }
                                            >
                                                <CheckCircle2
                                                    size={
                                                        17
                                                    }
                                                    color="#FFFFFF"
                                                />

                                                <Text
                                                    style={
                                                        styles.approveText
                                                    }
                                                >
                                                    Approve
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </Pressable>
                                )
                            )
                        )}
                    </>
                ) : (
                    <>
                        <View
                            style={styles.sectionHeader}
                        >
                            <Text
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Refund History
                            </Text>

                            <Text
                                style={
                                    styles.resultCount
                                }
                            >
                                {history.length}{" "}
                                records
                            </Text>
                        </View>

                        {history.length === 0 ? (
                            <View
                                style={
                                    styles.emptyCard
                                }
                            >
                                <History
                                    size={44}
                                    color="#CBD5E1"
                                />

                                <Text
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    No refund history
                                </Text>

                                <Text
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    Completed refunds will
                                    appear here.
                                </Text>
                            </View>
                        ) : (
                            history.map(
                                (refund) => (
                                    <Pressable
                                        key={
                                            refund.refundId
                                        }
                                        onPress={() =>
                                            router.push(
                                                `/admin/refunds/${refund.refundRequestId}`
                                            )
                                        }
                                        style={
                                            styles.card
                                        }
                                    >
                                        <View
                                            style={
                                                styles.cardTop
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.iconBox,
                                                    refund.status ===
                                                        "Completed"
                                                        ? styles.successIconBox
                                                        : styles.rejectedIconBox,
                                                ]}
                                            >
                                                {refund.status ===
                                                "Completed" ? (
                                                    <CheckCircle2
                                                        size={
                                                            20
                                                        }
                                                        color="#16A34A"
                                                    />
                                                ) : (
                                                    <XCircle
                                                        size={
                                                            20
                                                        }
                                                        color="#DC2626"
                                                    />
                                                )}
                                            </View>

                                            <View
                                                style={
                                                    styles.cardMain
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.cardTitle
                                                    }
                                                >
                                                    Refund #
                                                    {
                                                        refund.refundId
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.saleText
                                                    }
                                                >
                                                    Sale #
                                                    {
                                                        refund.saleId
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.cashier
                                                    }
                                                >
                                                    {
                                                        refund.cashier
                                                    }
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.historyAmount
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.amount
                                                    }
                                                >
                                                    {formatCurrency(
                                                        refund.amount
                                                    )}
                                                </Text>

                                                <Text
                                                    style={
                                                        refund.status ===
                                                        "Completed"
                                                            ? styles.completedText
                                                            : styles.rejectedText
                                                    }
                                                >
                                                    {
                                                        refund.status
                                                    }
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.divider
                                            }
                                        />

                                        <Text
                                            style={
                                                styles.reason
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {
                                                refund.reason
                                            }
                                        </Text>

                                        <Text
                                            style={
                                                styles.date
                                            }
                                        >
                                            Completed:{" "}
                                            {formatDate(
                                                refund.completedAt
                                            )}
                                        </Text>
                                    </Pressable>
                                )
                            )
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    scroll: {
        flex: 1,
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FA",
    },

    loadingText: {
        marginTop: 12,
        color: "#64748B",
        fontSize: 14,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 22,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        elevation: 2,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    subtitle: {
        marginTop: 3,
        color: "#64748B",
        fontSize: 13,
    },

    tabs: {
        flexDirection: "row",
        backgroundColor: "#E2E8F0",
        borderRadius: 14,
        padding: 4,
        marginBottom: 24,
    },

    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 11,
        borderRadius: 11,
    },

    tabActive: {
        backgroundColor: "#1769E0",
    },

    tabText: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "800",
    },

    tabTextActive: {
        color: "#FFFFFF",
    },

    countBadge: {
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        borderRadius: 11,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
    },

    countBadgeActive: {
        backgroundColor: "#FFFFFF",
    },

    countText: {
        color: "#DC2626",
        fontSize: 11,
        fontWeight: "800",
    },

    countTextActive: {
        color: "#1769E0",
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },

    resultCount: {
        fontSize: 13,
        color: "#64748B",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 17,
        marginBottom: 12,
        elevation: 2,
    },

    cardPressed: {
        opacity: 0.75,
    },

    cardTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    successIconBox: {
        backgroundColor: "#F0FDF4",
    },

    rejectedIconBox: {
        backgroundColor: "#FEF2F2",
    },

    cardMain: {
        flex: 1,
    },

    cardTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#111827",
    },

    saleText: {
        marginTop: 3,
        fontSize: 13,
        color: "#475569",
        fontWeight: "700",
    },

    cashier: {
        marginTop: 3,
        fontSize: 12,
        color: "#64748B",
    },

    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },

    reasonLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#94A3B8",
        marginBottom: 4,
    },

    reason: {
        fontSize: 13,
        lineHeight: 19,
        color: "#334155",
    },

    cardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
    },

    date: {
        fontSize: 12,
        color: "#94A3B8",
        marginTop: 8,
    },

    pendingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#FEF3C7",
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    pendingText: {
        color: "#92400E",
        fontSize: 11,
        fontWeight: "800",
    },

    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15,
    },

    rejectButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    rejectText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "800",
    },

    approveButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#16A34A",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    approveText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    historyAmount: {
        alignItems: "flex-end",
    },

    amount: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    completedText: {
        marginTop: 4,
        color: "#16A34A",
        fontSize: 11,
        fontWeight: "800",
    },

    rejectedText: {
        marginTop: 4,
        color: "#DC2626",
        fontSize: 11,
        fontWeight: "800",
    },

    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 40,
        alignItems: "center",
    },

    emptyTitle: {
        marginTop: 14,
        fontSize: 17,
        fontWeight: "800",
        color: "#334155",
        textAlign: "center",
    },

    emptyText: {
        marginTop: 7,
        color: "#94A3B8",
        fontSize: 13,
        lineHeight: 19,
        textAlign: "center",
    },
});