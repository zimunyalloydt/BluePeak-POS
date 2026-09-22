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

import { useLocalSearchParams, useRouter } from "expo-router";

import {
    getSaleReceipt,
    SaleReceipt,
} from "../../../../services/cashierSalesService";

import { requestRefund } from "../../../../services/refundService";

export default function CashierSaleDetailsScreen() {
    const router = useRouter();

    const { id } = useLocalSearchParams<{
        id: string;
    }>();

    const saleId = Number(id);

    const [sale, setSale] =
        useState<SaleReceipt | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [submittingRefund, setSubmittingRefund] =
        useState(false);

    const [showRefundForm, setShowRefundForm] =
        useState(false);

    const [reason, setReason] =
        useState("");

    const [notes, setNotes] =
        useState("");

    const loadSale = useCallback(async () => {
        try {
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

    useEffect(() => {
        loadSale();
    }, [loadSale]);

    const handleRefundRequest = async () => {
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
                saleId,
                reason: reason.trim(),
                notes: notes.trim() || undefined,
            });

            Alert.alert(
                "Refund Requested",
                "Your refund request has been submitted to an administrator.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            setShowRefundForm(false);
                            setReason("");
                            setNotes("");
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
                "Failed to submit refund request.";

            Alert.alert(
                "Refund Request Failed",
                message
            );
        } finally {
            setSubmittingRefund(false);
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
                        style={
                            styles.loadingText
                        }
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
                    <Text style={styles.emptyTitle}>
                        Sale not found
                    </Text>

                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
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
                    onPress={() => router.back()}
                >
                    <Text style={styles.backArrow}>
                        ‹
                    </Text>

                    <Text style={styles.backText}>
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

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
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
                                        {item.quantity} × $
                                        {Number(
                                            item.unitPrice
                                        ).toFixed(2)}
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
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        )
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Payment
                    </Text>

                    <View style={styles.amountRow}>
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

                    <View style={styles.amountRow}>
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

                    <View style={styles.divider} />

                    <View style={styles.amountRow}>
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
                            {sale.paymentMethod}
                        </Text>
                    </View>

                    <View style={styles.amountRow}>
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

                    <View style={styles.amountRow}>
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

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Cashier
                    </Text>

                    <Text style={styles.cashierName}>
                        {sale.cashier}
                    </Text>
                </View>

                {!showRefundForm ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.refundButton,
                            pressed &&
                                styles.buttonPressed,
                        ]}
                        onPress={() =>
                            setShowRefundForm(true)
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
                    <View style={styles.refundCard}>
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
                            onChangeText={setReason}
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
                            onChangeText={setNotes}
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

    refundTitle: {
        fontSize: 19,
        fontWeight: "900",
        color: "#991B1B",
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