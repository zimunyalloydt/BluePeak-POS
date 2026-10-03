
import React, { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import {
    getSaleReceipt,
    SaleReceipt,
} from "../../../../services/cashierSalesService";

import {
    getRefundStatus,
    requestRefund,
    RefundRequestStatus,
} from "../../../../services/refundService";

import { printerService } from "../../../../services/printerService";

export default function CashierSaleDetailsScreen() {
    const router = useRouter();

    const { id } = useLocalSearchParams<{
        id: string;
    }>();

    const saleId = Number(id);

    const [sale, setSale] =
        useState<SaleReceipt | null>(null);

    const [refundStatus, setRefundStatus] =
        useState<RefundRequestStatus | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [loadingRefundStatus, setLoadingRefundStatus] =
        useState(false);

    const [submittingRefund, setSubmittingRefund] =
        useState(false);

    const [printingReceipt, setPrintingReceipt] =
        useState(false);

    const [showRefundForm, setShowRefundForm] =
        useState(false);

    const [reason, setReason] =
        useState("");

    const [notes, setNotes] =
        useState("");

    const loadSale = useCallback(async () => {
        try {
            setLoading(true);

            const data =
                await getSaleReceipt(saleId);

            setSale(data);
        } catch (error) {
            console.error(
                "Failed to load sale:",
                error
            );

            Alert.alert(
                "Error",
                "Failed to load sale details."
            );
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    const loadRefundStatus =
        useCallback(async () => {
            if (!saleId || !Number.isFinite(saleId)) {
                return;
            }

            try {
                setLoadingRefundStatus(true);

                const data =
                    await getRefundStatus(saleId);

                setRefundStatus(data);
            } catch (error) {
                console.error(
                    "Failed to load refund status:",
                    error
                );
            } finally {
                setLoadingRefundStatus(false);
            }
        }, [saleId]);

    useEffect(() => {
        loadSale();
        loadRefundStatus();
    }, [
        loadSale,
        loadRefundStatus,
    ]);

    const handlePrintReceipt = async () => {
        if (!sale) {
            return;
        }

        try {
            setPrintingReceipt(true);

            await printerService.printReceipt(sale);

            Alert.alert(
                "Receipt Printed",
                `Receipt for Sale #${sale.saleId} was sent to the printer.`
            );
        } catch (error: any) {
            console.error(
                "Failed to print receipt:",
                error
            );

            Alert.alert(
                "Printing Failed",
                error?.message ||
                    "Unable to print the receipt. Make sure the RK-E260L printer is switched on and connected."
            );
        } finally {
            setPrintingReceipt(false);
        }
    };

    const handleRefundRequest = async () => {
        if (!sale) {
            return;
        }

        if (!sale.saleId) {
            Alert.alert(
                "Refund unavailable",
                "This sale does not have a valid server sale ID yet."
            );

            return;
        }

        if (refundStatus) {
            Alert.alert(
                "Refund already requested",
                `This sale already has a ${refundStatus.status.toLowerCase()} refund request.`
            );

            return;
        }

        if (!reason.trim()) {
            Alert.alert(
                "Refund reason required",
                "Please enter a reason for the refund."
            );

            return;
        }

        try {
            setSubmittingRefund(true);

            await requestRefund({
                saleId: sale.saleId,
                reason: reason.trim(),
                notes:
                    notes.trim() ||
                    undefined,
            });

            Alert.alert(
                "Refund Requested",
                "Your refund request has been submitted to an administrator.",
                [
                    {
                        text: "OK",
                        onPress: async () => {
                            setShowRefundForm(false);
                            setReason("");
                            setNotes("");

                            await loadRefundStatus();
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error(
                "Failed to request refund:",
                error
            );

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.Message ||
                "Failed to submit refund request.";

            Alert.alert(
                "Refund Request Failed",
                message
            );
        } finally {
            setSubmittingRefund(false);
        }
    };

    const getRefundStatusLabel = () => {
        if (!refundStatus) {
            return "";
        }

        switch (
            refundStatus.status
                .toLowerCase()
        ) {
            case "pending":
                return "PENDING";

            case "rejected":
                return "REJECTED";

            case "completed":
                return "COMPLETED";

            default:
                return refundStatus.status.toUpperCase();
        }
    };

    const getRefundStatusColor = () => {
        if (!refundStatus) {
            return "#64748B";
        }

        switch (
            refundStatus.status
                .toLowerCase()
        ) {
            case "pending":
                return "#B45309";

            case "rejected":
                return "#B91C1C";

            case "completed":
                return "#166534";

            default:
                return "#475569";
        }
    };

    const getRefundStatusBackground = () => {
        if (!refundStatus) {
            return "#F1F5F9";
        }

        switch (
            refundStatus.status
                .toLowerCase()
        ) {
            case "pending":
                return "#FEF3C7";

            case "rejected":
                return "#FEE2E2";

            case "completed":
                return "#DCFCE7";

            default:
                return "#F1F5F9";
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                style={styles.container}
            >
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color="#1769E0"
                    />

                    <Text
                        style={styles.loadingText}
                    >
                        Loading sale...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!sale) {
        return (
            <SafeAreaView
                style={styles.container}
            >
                <View style={styles.empty}>
                    <Text
                        style={styles.emptyTitle}
                    >
                        Sale not found
                    </Text>

                    <Pressable
                        style={styles.backButton}
                        onPress={() =>
                            router.back()
                        }
                    >
                        <Text
                            style={
                                styles.backButtonText
                            }
                        >
                            Go Back
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const hasRefundRequest =
        refundStatus !== null;

    const isRefundCompleted =
        refundStatus?.status
            ?.toLowerCase() ===
        "completed";

    const isRefundPending =
        refundStatus?.status
            ?.toLowerCase() ===
        "pending";

    const isRefundRejected =
        refundStatus?.status
            ?.toLowerCase() ===
        "rejected";

    return (
        <SafeAreaView
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                <Pressable
                    style={styles.backRow}
                    onPress={() =>
                        router.back()
                    }
                >
                    <Text
                        style={styles.backArrow}
                    >
                        ‹
                    </Text>

                    <Text
                        style={styles.backText}
                    >
                        My Sales
                    </Text>
                </Pressable>

                <View style={styles.header}>
                    <View>
                        <Text
                            style={
                                styles.saleTitle
                            }
                        >
                            Sale #{sale.saleId}
                        </Text>

                        <Text
                            style={
                                styles.saleDate
                            }
                        >
                            {new Date(
                                sale.saleDate
                            ).toLocaleString()}
                        </Text>
                    </View>

                    <View
                        style={
                            styles.completedBadge
                        }
                    >
                        <Text
                            style={
                                styles.completedText
                            }
                        >
                            COMPLETED
                        </Text>
                    </View>
                </View>

                {/* Items */}
                <View style={styles.card}>
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Items
                    </Text>

                    {sale.items.map(
                        (item, index) => (
                            <View
                                key={`${item.productName}-${index}`}
                                style={
                                    styles.itemRow
                                }
                            >
                                <View
                                    style={
                                        styles.itemInfo
                                    }
                                >
                                    <Text
                                        style={
                                            styles.productName
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
                                        × $
                                        {Number(
                                            item.unitPrice
                                        ).toFixed(
                                            2
                                        )}
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.itemTotal
                                    }
                                >
                                    $
                                    {Number(
                                        item.total
                                    ).toFixed(
                                        2
                                    )}
                                </Text>
                            </View>
                        )
                    )}
                </View>

                {/* Payment */}
                <View style={styles.card}>
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Payment
                    </Text>

                    <View
                        style={styles.amountRow}
                    >
                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            Subtotal
                        </Text>

                        <Text
                            style={
                                styles.amountValue
                            }
                        >
                            $
                            {Number(
                                sale.subtotal
                            ).toFixed(2)}
                        </Text>
                    </View>

                    <View
                        style={styles.amountRow}
                    >
                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            VAT
                        </Text>

                        <Text
                            style={
                                styles.amountValue
                            }
                        >
                            $
                            {Number(
                                sale.vat
                            ).toFixed(2)}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.amountRow,
                            styles.totalRow,
                        ]}
                    >
                        <Text
                            style={
                                styles.totalLabel
                            }
                        >
                            Total
                        </Text>

                        <Text
                            style={
                                styles.totalValue
                            }
                        >
                            $
                            {Number(
                                sale.total
                            ).toFixed(2)}
                        </Text>
                    </View>

                    <View
                        style={styles.divider}
                    />

                    <View
                        style={styles.amountRow}
                    >
                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            Payment method
                        </Text>

                        <Text
                            style={
                                styles.amountValue
                            }
                        >
                            {
                                sale.paymentMethod
                            }
                        </Text>
                    </View>

                    <View
                        style={styles.amountRow}
                    >
                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            Amount paid
                        </Text>

                        <Text
                            style={
                                styles.amountValue
                            }
                        >
                            $
                            {Number(
                                sale.amountPaid
                            ).toFixed(2)}
                        </Text>
                    </View>

                    <View
                        style={styles.amountRow}
                    >
                        <Text
                            style={
                                styles.amountLabel
                            }
                        >
                            Change
                        </Text>

                        <Text
                            style={
                                styles.changeValue
                            }
                        >
                            $
                            {Number(
                                sale.changeGiven
                            ).toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Cashier */}
                <View style={styles.card}>
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Cashier
                    </Text>

                    <Text
                        style={
                            styles.cashierName
                        }
                    >
                        {sale.cashier}
                    </Text>
                </View>

                {/* Print receipt */}
                <Pressable
                    style={[
                        styles.printButton,
                        printingReceipt &&
                            styles.disabledButton,
                    ]}
                    onPress={
                        handlePrintReceipt
                    }
                    disabled={
                        printingReceipt
                    }
                >
                    {printingReceipt ? (
                        <ActivityIndicator
                            color="#FFFFFF"
                        />
                    ) : (
                        <>
                            <Text
                                style={
                                    styles.printButtonIcon
                                }
                            >
                                🖨️
                            </Text>

                            <Text
                                style={
                                    styles.printButtonText
                                }
                            >
                                PRINT RECEIPT
                            </Text>
                        </>
                    )}
                </Pressable>

                {/* Refund status */}
                {loadingRefundStatus ? (
                    <View
                        style={
                            styles.refundLoadingCard
                        }
                    >
                        <ActivityIndicator
                            size="small"
                            color="#1769E0"
                        />

                        <Text
                            style={
                                styles.refundLoadingText
                            }
                        >
                            Checking refund status...
                        </Text>
                    </View>
                ) : hasRefundRequest ? (
                    <View
                        style={
                            styles.refundStatusCard
                        }
                    >
                        <View
                            style={
                                styles.refundStatusHeader
                            }
                        >
                            <Text
                                style={
                                    styles.refundTitle
                                }
                            >
                                Refund Request
                            </Text>

                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            getRefundStatusBackground(),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.statusBadgeText,
                                        {
                                            color:
                                                getRefundStatusColor(),
                                        },
                                    ]}
                                >
                                    {getRefundStatusLabel()}
                                </Text>
                            </View>
                        </View>

                        <Text
                            style={
                                styles.refundReason
                            }
                        >
                            {refundStatus?.reason}
                        </Text>

                        {isRefundPending && (
                            <Text
                                style={
                                    styles.refundStatusDescription
                                }
                            >
                                Your refund request is
                                waiting for administrator
                                approval.
                            </Text>
                        )}

                        {isRefundRejected && (
                            <Text
                                style={
                                    styles.refundStatusDescription
                                }
                            >
                                This refund request was
                                rejected by an administrator.
                            </Text>
                        )}

                        {isRefundCompleted && (
                            <Text
                                style={
                                    styles.refundStatusDescription
                                }
                            >
                                This sale has been refunded
                                successfully.
                            </Text>
                        )}

                        <Text
                            style={
                                styles.requestDate
                            }
                        >
                            Requested{" "}
                            {new Date(
                                refundStatus!.requestedAt
                            ).toLocaleString()}
                        </Text>
                    </View>
                ) : !showRefundForm ? (
                    <Pressable
                        style={({
                            pressed,
                        }) => [
                            styles.refundButton,
                            pressed &&
                                styles.buttonPressed,
                        ]}
                        onPress={() =>
                            setShowRefundForm(
                                true
                            )
                        }
                    >
                        <Text
                            style={
                                styles.refundButtonText
                            }
                        >
                            REQUEST REFUND
                        </Text>
                    </Pressable>
                ) : (
                    <View
                        style={
                            styles.refundCard
                        }
                    >
                        <Text
                            style={
                                styles.refundTitle
                            }
                        >
                            Request Refund
                        </Text>

                        <Text
                            style={
                                styles.refundDescription
                            }
                        >
                            This will send the refund
                            request to an administrator
                            for approval.
                        </Text>

                        <Text
                            style={
                                styles.inputLabel
                            }
                        >
                            Reason
                        </Text>

                        <TextInput
                            value={reason}
                            onChangeText={
                                setReason
                            }
                            placeholder="Why is this sale being refunded?"
                            placeholderTextColor="#94A3B8"
                            multiline
                            style={
                                styles.textInput
                            }
                        />

                        <Text
                            style={
                                styles.inputLabel
                            }
                        >
                            Notes (optional)
                        </Text>

                        <TextInput
                            value={notes}
                            onChangeText={
                                setNotes
                            }
                            placeholder="Additional information..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            style={
                                styles.textInput
                            }
                        />

                        <View
                            style={
                                styles.refundActions
                            }
                        >
                            <Pressable
                                style={
                                    styles.cancelButton
                                }
                                onPress={() =>
                                    setShowRefundForm(
                                        false
                                    )
                                }
                                disabled={
                                    submittingRefund
                                }
                            >
                                <Text
                                    style={
                                        styles.cancelButtonText
                                    }
                                >
                                    CANCEL
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.submitButton,
                                    submittingRefund &&
                                        styles.disabledButton,
                                ]}
                                onPress={
                                    handleRefundRequest
                                }
                                disabled={
                                    submittingRefund
                                }
                            >
                                {submittingRefund ? (
                                    <ActivityIndicator
                                        color="#FFFFFF"
                                    />
                                ) : (
                                    <Text
                                        style={
                                            styles.submitButtonText
                                        }
                                    >
                                        SUBMIT REQUEST
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    content: {
        padding: 20,
        paddingBottom: 50,
    },

    backRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },

    backArrow: {
        fontSize: 32,
        lineHeight: 32,
        color: "#1769E0",
        marginRight: 6,
    },

    backText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1769E0",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },

    saleTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#0B1F3A",
    },

    saleDate: {
        marginTop: 5,
        fontSize: 13,
        color: "#64748B",
    },

    completedBadge: {
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },

    completedText: {
        fontSize: 10,
        fontWeight: "900",
        color: "#166534",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#0B1F3A",
        marginBottom: 14,
    },

    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },

    itemInfo: {
        flex: 1,
        paddingRight: 10,
    },

    productName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0F172A",
    },

    itemMeta: {
        marginTop: 4,
        fontSize: 12,
        color: "#64748B",
    },

    itemTotal: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    amountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 7,
    },

    amountLabel: {
        fontSize: 13,
        color: "#64748B",
    },

    amountValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#0F172A",
    },

    totalRow: {
        marginTop: 5,
        paddingTop: 14,
    },

    totalLabel: {
        fontSize: 17,
        fontWeight: "900",
        color: "#0B1F3A",
    },

    totalValue: {
        fontSize: 22,
        fontWeight: "900",
        color: "#1769E0",
    },

    changeValue: {
        fontSize: 13,
        fontWeight: "800",
        color: "#15803D",
    },

    divider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 10,
    },

    cashierName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0F172A",
    },

    printButton: {
        backgroundColor: "#1769E0",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginBottom: 14,
    },

    printButtonIcon: {
        fontSize: 18,
        marginRight: 8,
    },

    printButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    refundButton: {
        backgroundColor: "#DC2626",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 4,
    },

    refundButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },

    refundCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#FECACA",
        marginTop: 4,
    },

    refundStatusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginTop: 4,
    },

    refundLoadingCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    refundLoadingText: {
        marginLeft: 10,
        fontSize: 13,
        color: "#64748B",
    },

    refundStatusHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    refundTitle: {
        fontSize: 19,
        fontWeight: "900",
        color: "#991B1B",
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },

    statusBadgeText: {
        fontSize: 10,
        fontWeight: "900",
    },

    refundReason: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        color: "#0F172A",
    },

    refundStatusDescription: {
        marginTop: 10,
        fontSize: 13,
        lineHeight: 19,
        color: "#64748B",
    },

    requestDate: {
        marginTop: 12,
        fontSize: 11,
        color: "#94A3B8",
    },

    refundDescription: {
        marginTop: 6,
        marginBottom: 16,
        fontSize: 13,
        lineHeight: 19,
        color: "#64748B",
    },

    inputLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: "#334155",
        marginBottom: 6,
        marginTop: 8,
    },

    textInput: {
        minHeight: 90,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 12,
        padding: 12,
        color: "#0F172A",
        textAlignVertical: "top",
    },

    refundActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },

    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },

    cancelButtonText: {
        fontSize: 12,
        fontWeight: "900",
        color: "#475569",
    },

    submitButton: {
        flex: 1,
        backgroundColor: "#DC2626",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },

    submitButtonText: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FFFFFF",
    },

    disabledButton: {
        opacity: 0.6,
    },

    buttonPressed: {
        opacity: 0.7,
    },

    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        marginTop: 10,
        color: "#64748B",
    },

    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#0B1F3A",
        marginBottom: 16,
    },

    backButton: {
        backgroundColor: "#1769E0",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },

    backButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },
});