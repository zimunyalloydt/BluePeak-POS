import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Package,
    User,
    XCircle,
} from "lucide-react-native";

import { router, useLocalSearchParams } from "expo-router";

import {
    approveRefund,
    getRefundDetails,
    rejectRefund,
    RefundDetails,
} from "../../../services/refundService";

function formatCurrency(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
        undefined,
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

export default function AdminRefundDetailsScreen() {
    const params = useLocalSearchParams<{
        id: string;
    }>();

    const refundRequestId = Number(params.id);

    const [refund, setRefund] =
        useState<RefundDetails | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [processing, setProcessing] =
        useState(false);

    const loadRefund = async () => {
        try {
            if (!refundRequestId) {
                throw new Error(
                    "Invalid refund request ID."
                );
            }

            const data =
                await getRefundDetails(
                    refundRequestId
                );

            setRefund(data);
        } catch (error: any) {
            console.error(
                "Failed to load refund:",
                error
            );

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                    "Failed to load refund details.",
                [
                    {
                        text: "Go Back",
                        onPress: () =>
                            router.back(),
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRefund();
    }, [refundRequestId]);

    const handleApprove = () => {
        if (!refund) return;

        Alert.alert(
            "Approve Refund",
            `Approve refund for Sale #${refund.saleId} for ${formatCurrency(
                refund.amount
            )}?\n\nStock will be restored.`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Approve",
                    onPress: async () => {
                        try {
                            setProcessing(true);

                            await approveRefund(
                                refund.refundRequestId
                            );

                            Alert.alert(
                                "Refund Approved",
                                "The refund has been approved successfully.",
                                [
                                    {
                                        text: "OK",
                                        onPress: () =>
                                            router.back(),
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error(
                                "Approve refund error:",
                                error
                            );

                            Alert.alert(
                                "Approval Failed",
                                error?.response?.data
                                    ?.message ||
                                    "Failed to approve the refund."
                            );
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = () => {
        if (!refund) return;

        Alert.alert(
            "Reject Refund",
            `Reject the refund request for Sale #${refund.saleId}?`,
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
                            setProcessing(true);

                            await rejectRefund(
                                refund.refundRequestId
                            );

                            Alert.alert(
                                "Refund Rejected",
                                "The refund request has been rejected.",
                                [
                                    {
                                        text: "OK",
                                        onPress: () =>
                                            router.back(),
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error(
                                "Reject refund error:",
                                error
                            );

                            Alert.alert(
                                "Rejection Failed",
                                error?.response?.data
                                    ?.message ||
                                    "Failed to reject the refund."
                            );
                        } finally {
                            setProcessing(false);
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
                    Loading refund details...
                </Text>
            </SafeAreaView>
        );
    }

    if (!refund) {
        return (
            <SafeAreaView
                style={styles.loadingContainer}
            >
                <Text style={styles.errorTitle}>
                    Refund not found
                </Text>

                <Pressable
                    onPress={() => router.back()}
                    style={styles.backAction}
                >
                    <Text
                        style={
                            styles.backActionText
                        }
                    >
                        Go Back
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const isPending =
        refund.status === "Pending";

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* Header */}

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

                    <View style={styles.headerText}>
                        <Text
                            style={styles.title}
                        >
                            Refund Details
                        </Text>

                        <Text
                            style={styles.subtitle}
                        >
                            Refund Request #
                            {
                                refund.refundRequestId
                            }
                        </Text>
                    </View>
                </View>

                {/* Status */}

                <View
                    style={[
                        styles.statusCard,
                        isPending
                            ? styles.pendingCard
                            : refund.status ===
                              "Completed"
                            ? styles.completedCard
                            : styles.rejectedCard,
                    ]}
                >
                    {isPending ? (
                        <Clock3
                            size={24}
                            color="#92400E"
                        />
                    ) : refund.status ===
                      "Completed" ? (
                        <CheckCircle2
                            size={24}
                            color="#166534"
                        />
                    ) : (
                        <XCircle
                            size={24}
                            color="#991B1B"
                        />
                    )}

                    <View
                        style={
                            styles.statusContent
                        }
                    >
                        <Text
                            style={
                                isPending
                                    ? styles.pendingStatus
                                    : refund.status ===
                                      "Completed"
                                    ? styles.completedStatus
                                    : styles.rejectedStatus
                            }
                        >
                            {refund.status}
                        </Text>

                        <Text
                            style={
                                styles.statusDescription
                            }
                        >
                            {isPending
                                ? "Waiting for administrator approval."
                                : refund.status ===
                                  "Completed"
                                ? "This refund has been completed."
                                : "This refund request was rejected."}
                        </Text>
                    </View>
                </View>

                {/* Sale */}

                <View style={styles.card}>
                    <View
                        style={styles.cardHeader}
                    >
                        <Text
                            style={styles.cardTitle}
                        >
                            Sale Information
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text
                            style={styles.infoLabel}
                        >
                            Sale ID
                        </Text>

                        <Text
                            style={styles.infoValue}
                        >
                            #{refund.saleId}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text
                            style={styles.infoLabel}
                        >
                            Payment Method
                        </Text>

                        <Text
                            style={styles.infoValue}
                        >
                            {refund.paymentMethod ||
                                "—"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text
                            style={styles.infoLabel}
                        >
                            Refund Amount
                        </Text>

                        <Text
                            style={
                                styles.amountValue
                            }
                        >
                            {formatCurrency(
                                refund.amount
                            )}
                        </Text>
                    </View>
                </View>

                {/* Cashier */}

                <View style={styles.card}>
                    <View
                        style={styles.personRow}
                    >
                        <View
                            style={
                                styles.personIcon
                            }
                        >
                            <User
                                size={19}
                                color="#1769E0"
                            />
                        </View>

                        <View>
                            <Text
                                style={
                                    styles.personLabel
                                }
                            >
                                CASHIER
                            </Text>

                            <Text
                                style={
                                    styles.personName
                                }
                            >
                                {refund.cashier ||
                                    "Unknown"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Reason */}

                <View style={styles.card}>
                    <Text
                        style={styles.cardTitle}
                    >
                        Refund Reason
                    </Text>

                    <Text
                        style={styles.reason}
                    >
                        {refund.reason ||
                            "No reason provided."}
                    </Text>

                    {refund.notes ? (
                        <>
                            <Text
                                style={
                                    styles.notesLabel
                                }
                            >
                                NOTES
                            </Text>

                            <Text
                                style={
                                    styles.notes
                                }
                            >
                                {refund.notes}
                            </Text>
                        </>
                    ) : null}
                </View>

                {/* Items */}

                <View style={styles.card}>
                    <View
                        style={styles.itemsHeader}
                    >
                        <View
                            style={
                                styles.itemsTitleRow
                            }
                        >
                            <Package
                                size={19}
                                color="#1769E0"
                            />

                            <Text
                                style={
                                    styles.cardTitle
                                }
                            >
                                Items
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.itemCount
                            }
                        >
                            {refund.items.length}{" "}
                            {refund.items.length ===
                            1
                                ? "item"
                                : "items"}
                        </Text>
                    </View>

                    {refund.items.map(
                        (item, index) => (
                            <View
                                key={`${item.saleItemId}-${index}`}
                                style={[
                                    styles.itemRow,
                                    index <
                                        refund.items
                                            .length -
                                            1 &&
                                        styles.itemBorder,
                                ]}
                            >
                                <View
                                    style={
                                        styles.itemMain
                                    }
                                >
                                    <Text
                                        style={
                                            styles.itemName
                                        }
                                    >
                                        {
                                            item.productName
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.itemMeta
                                        }
                                    >
                                        {
                                            item.quantity
                                        }{" "}
                                        ×{" "}
                                        {formatCurrency(
                                            item.unitPrice
                                        )}
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.itemTotal
                                    }
                                >
                                    {formatCurrency(
                                        item.total
                                    )}
                                </Text>
                            </View>
                        )
                    )}

                    <View
                        style={
                            styles.totalRow
                        }
                    >
                        <Text
                            style={
                                styles.totalLabel
                            }
                        >
                            Refund Total
                        </Text>

                        <Text
                            style={
                                styles.totalValue
                            }
                        >
                            {formatCurrency(
                                refund.amount
                            )}
                        </Text>
                    </View>
                </View>

                {/* Timeline */}

                <View style={styles.card}>
                    <Text
                        style={styles.cardTitle}
                    >
                        Timeline
                    </Text>

                    <View
                        style={styles.timelineRow}
                    >
                        <View
                            style={
                                styles.timelineDot
                            }
                        />

                        <View
                            style={
                                styles.timelineContent
                            }
                        >
                            <Text
                                style={
                                    styles.timelineTitle
                                }
                            >
                                Request Submitted
                            </Text>

                            <Text
                                style={
                                    styles.timelineDate
                                }
                            >
                                {formatDate(
                                    refund.requestedAt
                                )}
                            </Text>
                        </View>
                    </View>

                    {refund.approvedAt ? (
                        <View
                            style={
                                styles.timelineRow
                            }
                        >
                            <View
                                style={[
                                    styles.timelineDot,
                                    styles.timelineDotGreen,
                                ]}
                            />

                            <View
                                style={
                                    styles.timelineContent
                                }
                            >
                                <Text
                                    style={
                                        styles.timelineTitle
                                    }
                                >
                                    Approved
                                </Text>

                                <Text
                                    style={
                                        styles.timelineDate
                                    }
                                >
                                    {formatDate(
                                        refund.approvedAt
                                    )}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {refund.completedAt ? (
                        <View
                            style={
                                styles.timelineRow
                            }
                        >
                            <View
                                style={[
                                    styles.timelineDot,
                                    styles.timelineDotGreen,
                                ]}
                            />

                            <View
                                style={
                                    styles.timelineContent
                                }
                            >
                                <Text
                                    style={
                                        styles.timelineTitle
                                    }
                                >
                                    Completed
                                </Text>

                                <Text
                                    style={
                                        styles.timelineDate
                                    }
                                >
                                    {formatDate(
                                        refund.completedAt
                                    )}
                                </Text>
                            </View>
                        </View>
                    ) : null}

                    {refund.processedBy ? (
                        <Text
                            style={
                                styles.processedBy
                            }
                        >
                            Processed by{" "}
                            <Text
                                style={
                                    styles.processedByStrong
                                }
                            >
                                {
                                    refund.processedBy
                                }
                            </Text>
                        </Text>
                    ) : null}
                </View>

                {/* Actions */}

                {isPending && (
                    <View
                        style={styles.actions}
                    >
                        <Pressable
                            disabled={processing}
                            onPress={
                                handleReject
                            }
                            style={({ pressed }) => [
                                styles.rejectButton,
                                pressed &&
                                    styles.buttonPressed,
                                processing &&
                                    styles.disabledButton,
                            ]}
                        >
                            <XCircle
                                size={19}
                                color="#DC2626"
                            />

                            <Text
                                style={
                                    styles.rejectButtonText
                                }
                            >
                                Reject Refund
                            </Text>
                        </Pressable>

                        <Pressable
                            disabled={processing}
                            onPress={
                                handleApprove
                            }
                            style={({ pressed }) => [
                                styles.approveButton,
                                pressed &&
                                    styles.buttonPressed,
                                processing &&
                                    styles.disabledButton,
                            ]}
                        >
                            {processing ? (
                                <ActivityIndicator
                                    color="#FFFFFF"
                                />
                            ) : (
                                <CheckCircle2
                                    size={19}
                                    color="#FFFFFF"
                                />
                            )}

                            <Text
                                style={
                                    styles.approveButtonText
                                }
                            >
                                Approve Refund
                            </Text>
                        </Pressable>
                    </View>
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

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F7FA",
    },

    loadingText: {
        marginTop: 12,
        color: "#64748B",
        fontSize: 14,
    },

    errorTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },

    backAction: {
        marginTop: 16,
        backgroundColor: "#1769E0",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },

    backActionText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
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

    headerText: {
        flex: 1,
    },

    title: {
        fontSize: 27,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    subtitle: {
        marginTop: 3,
        fontSize: 13,
        color: "#64748B",
    },

    statusCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
    },

    pendingCard: {
        backgroundColor: "#FFFBEB",
        borderColor: "#FDE68A",
    },

    completedCard: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
    },

    rejectedCard: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
    },

    statusContent: {
        flex: 1,
        marginLeft: 12,
    },

    pendingStatus: {
        color: "#92400E",
        fontSize: 15,
        fontWeight: "800",
    },

    completedStatus: {
        color: "#166534",
        fontSize: 15,
        fontWeight: "800",
    },

    rejectedStatus: {
        color: "#991B1B",
        fontSize: 15,
        fontWeight: "800",
    },

    statusDescription: {
        marginTop: 3,
        color: "#64748B",
        fontSize: 12,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 17,
        marginBottom: 14,
        elevation: 2,
    },

    cardHeader: {
        marginBottom: 8,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
    },

    infoLabel: {
        color: "#64748B",
        fontSize: 13,
    },

    infoValue: {
        color: "#111827",
        fontSize: 13,
        fontWeight: "700",
    },

    amountValue: {
        color: "#1769E0",
        fontSize: 17,
        fontWeight: "800",
    },

    personRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    personIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: "#EAF1FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    personLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#94A3B8",
    },

    personName: {
        marginTop: 3,
        color: "#111827",
        fontSize: 15,
        fontWeight: "800",
    },

    reason: {
        marginTop: 10,
        color: "#334155",
        fontSize: 14,
        lineHeight: 21,
    },

    notesLabel: {
        marginTop: 18,
        fontSize: 9,
        fontWeight: "800",
        color: "#94A3B8",
    },

    notes: {
        marginTop: 5,
        color: "#475569",
        fontSize: 13,
        lineHeight: 19,
    },

    itemsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },

    itemsTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    itemCount: {
        fontSize: 12,
        color: "#64748B",
    },

    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },

    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },

    itemMain: {
        flex: 1,
    },

    itemName: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },

    itemMeta: {
        marginTop: 4,
        color: "#64748B",
        fontSize: 12,
    },

    itemTotal: {
        marginLeft: 15,
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 14,
        marginTop: 4,
    },

    totalLabel: {
        fontSize: 14,
        fontWeight: "800",
        color: "#334155",
    },

    totalValue: {
        fontSize: 19,
        fontWeight: "900",
        color: "#1769E0",
    },

    timelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 16,
    },

    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#1769E0",
        marginTop: 4,
        marginRight: 12,
    },

    timelineDotGreen: {
        backgroundColor: "#16A34A",
    },

    timelineContent: {
        flex: 1,
    },

    timelineTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
    },

    timelineDate: {
        marginTop: 3,
        fontSize: 12,
        color: "#94A3B8",
    },

    processedBy: {
        marginTop: 18,
        fontSize: 12,
        color: "#64748B",
    },

    processedByStrong: {
        fontWeight: "800",
        color: "#334155",
    },

    actions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 2,
    },

    rejectButton: {
        flex: 1,
        height: 50,
        borderRadius: 13,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
    },

    rejectButtonText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "800",
    },

    approveButton: {
        flex: 1,
        height: 50,
        borderRadius: 13,
        backgroundColor: "#16A34A",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
    },

    approveButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    buttonPressed: {
        opacity: 0.75,
    },

    disabledButton: {
        opacity: 0.6,
    },
});