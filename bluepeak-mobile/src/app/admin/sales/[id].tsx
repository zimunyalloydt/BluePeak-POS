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
import { useResponsive } from "../../../utils/responsive";
import { useCallback,useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Banknote,
    Calendar,
    ChevronRight,
    CreditCard,
    Receipt,
    User,
} from "lucide-react-native";

import { getAdminSaleDetails } from "../../../services/adminService";

type SaleItem = {
    saleItemId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    total: number;
    profit: number;
};

type SaleDetails = {
    saleId: number;
    saleDate: string;
    cashier: string;
    customerName: string | null;
    paymentMethod: string;
    subtotal: number;
    vat: number;
    total: number;
    amountPaid: number;
    changeGiven: number;
    profit: number;
    items: SaleItem[];
};

function money(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function dateTime(value: string) {
    const date = new Date(value);

    return `${date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })} • ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })}`;
}

export default function AdminSaleDetails() {
    const router = useRouter();

    const { id } = useLocalSearchParams<{
        id: string;
    }>();

    const [sale, setSale] =
        useState<SaleDetails | null>(null);

    const [loading, setLoading] = useState(true);

    const loadSale = useCallback(async () => {
        try {
            const data = await getAdminSaleDetails(
                Number(id)
            );

            setSale(data);
        } catch (error) {
            console.error(
                "Failed to load sale:",
                error
            );

            Alert.alert(
                "Unable to load sale",
                "The sale could not be found.",
                [
                    {
                        text: "Go Back",
                        onPress: () => router.back(),
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    }, [id, router]);

  useEffect(() => {
    loadSale();
}, [loadSale]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loading}>
                <ActivityIndicator
                    size="large"
                    color="#1769E0"
                />

                <Text style={styles.loadingText}>
                    Loading sale...
                </Text>
            </SafeAreaView>
        );
    }

    if (!sale) {
        return null;
    }

    const isLoss = sale.profit < 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
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

                    <View>
                        <Text style={styles.title}>
                            Sale #{sale.saleId}
                        </Text>

                        <Text style={styles.subtitle}>
                            Transaction details
                        </Text>
                    </View>
                </View>

                {/* Total */}
                <View style={styles.heroCard}>
                    <View style={styles.receiptIcon}>
                        <Receipt
                            size={25}
                            color="#1769E0"
                        />
                    </View>

                    <Text style={styles.heroLabel}>
                        TOTAL SALE
                    </Text>

                    <Text style={styles.heroTotal}>
                        {money(sale.total)}
                    </Text>

                    <View
                        style={[
                            styles.profitBadge,
                            isLoss &&
                                styles.lossBadge,
                        ]}
                    >
                        <Text
                            style={[
                                styles.profitBadgeText,
                                isLoss &&
                                    styles.lossBadgeText,
                            ]}
                        >
                            {isLoss
                                ? "Loss "
                                : "Profit +"}
                            {money(
                                Math.abs(sale.profit)
                            )}
                        </Text>
                    </View>
                </View>

                {/* Transaction information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Transaction
                    </Text>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Calendar
                                size={18}
                                color="#1769E0"
                            />
                        </View>

                        <View>
                            <Text
                                style={styles.detailLabel}
                            >
                                Date & Time
                            </Text>

                            <Text
                                style={styles.detailValue}
                            >
                                {dateTime(sale.saleDate)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <User
                                size={18}
                                color="#1769E0"
                            />
                        </View>

                        <View>
                            <Text
                                style={styles.detailLabel}
                            >
                                Cashier
                            </Text>

                            <Text
                                style={styles.detailValue}
                            >
                                {sale.cashier}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            {sale.paymentMethod
                                ?.toLowerCase() ===
                            "cash" ? (
                                <Banknote
                                    size={18}
                                    color="#1769E0"
                                />
                            ) : (
                                <CreditCard
                                    size={18}
                                    color="#1769E0"
                                />
                            )}
                        </View>

                        <View>
                            <Text
                                style={styles.detailLabel}
                            >
                                Payment Method
                            </Text>

                            <Text
                                style={styles.detailValue}
                            >
                                {sale.paymentMethod}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <User
                                size={18}
                                color="#1769E0"
                            />
                        </View>

                        <View>
                            <Text
                                style={styles.detailLabel}
                            >
                                Customer
                            </Text>

                            <Text
                                style={styles.detailValue}
                            >
                                {sale.customerName ||
                                    "Walk-in Customer"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Items */}
                <View style={styles.card}>
                    <View style={styles.itemsHeader}>
                        <Text style={styles.cardTitle}>
                            Items
                        </Text>

                        <Text style={styles.itemsCount}>
                            {sale.items.length} items
                        </Text>
                    </View>

                    {sale.items.map((item) => {
                        const itemLoss =
                            item.profit < 0;

                        return (
                            <View
                                key={item.saleItemId}
                                style={styles.item}
                            >
                                <View style={styles.itemMain}>
                                    <Text
                                        style={
                                            styles.productName
                                        }
                                    >
                                        {item.productName}
                                    </Text>

                                    <Text
                                        style={
                                            styles.productMeta
                                        }
                                    >
                                        {item.quantity} ×{" "}
                                        {money(
                                            item.unitPrice
                                        )}
                                    </Text>
                                </View>

                                <View style={styles.itemRight}>
                                    <Text
                                        style={
                                            styles.itemTotal
                                        }
                                    >
                                        {money(item.total)}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.itemProfit,
                                            itemLoss &&
                                                styles.itemLoss,
                                        ]}
                                    >
                                        {itemLoss
                                            ? "-"
                                            : "+"}
                                        {money(
                                            Math.abs(
                                                item.profit
                                            )
                                        )}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Financial breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Payment Summary
                    </Text>

                    <View style={styles.moneyRow}>
                        <Text style={styles.moneyLabel}>
                            Subtotal
                        </Text>

                        <Text style={styles.moneyValue}>
                            {money(sale.subtotal)}
                        </Text>
                    </View>

                    <View style={styles.moneyRow}>
                        <Text style={styles.moneyLabel}>
                            VAT
                        </Text>

                        <Text style={styles.moneyValue}>
                            {money(sale.vat)}
                        </Text>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.moneyRow}>
                        <Text style={styles.totalLabel}>
                            Total
                        </Text>

                        <Text style={styles.totalValue}>
                            {money(sale.total)}
                        </Text>
                    </View>

                    <View style={styles.moneyRow}>
                        <Text style={styles.moneyLabel}>
                            Amount Paid
                        </Text>

                        <Text style={styles.moneyValue}>
                            {money(sale.amountPaid)}
                        </Text>
                    </View>

                    <View style={styles.moneyRow}>
                        <Text style={styles.moneyLabel}>
                            Change
                        </Text>

                        <Text
                            style={[
                                styles.moneyValue,
                                sale.changeGiven < 0 &&
                                    styles.negativeChange,
                            ]}
                        >
                            {money(sale.changeGiven)}
                        </Text>
                    </View>
                </View>

                {/* Profit */}
                <View style={styles.profitCard}>
                    <View>
                        <Text style={styles.profitTitle}>
                            Sale Profit
                        </Text>

                        <Text
                            style={styles.profitDescription}
                        >
                            Revenue minus product cost
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.profitAmount,
                            isLoss &&
                                styles.lossAmount,
                        ]}
                    >
                        {isLoss ? "-" : "+"}
                        {money(
                            Math.abs(sale.profit)
                        )}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F7FA",
    },

    loadingText: {
        marginTop: 10,
        color: "#64748B",
    },

    content: {
        padding: 20,
        paddingBottom: 40,
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
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },

    title: {
        fontSize: 26,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    subtitle: {
        marginTop: 3,
        color: "#64748B",
        fontSize: 13,
    },

    heroCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        alignItems: "center",
        padding: 25,
        marginBottom: 16,
    },

    receiptIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    heroLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#94A3B8",
    },

    heroTotal: {
        fontSize: 36,
        fontWeight: "900",
        color: "#0B1F3A",
        marginTop: 5,
    },

    profitBadge: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#DCFCE7",
    },

    profitBadgeText: {
        color: "#166534",
        fontSize: 12,
        fontWeight: "800",
    },

    lossBadge: {
        backgroundColor: "#FEE2E2",
    },

    lossBadgeText: {
        color: "#991B1B",
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 16,
    },

    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 17,
    },

    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    detailLabel: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: "700",
    },

    detailValue: {
        marginTop: 3,
        fontSize: 14,
        color: "#334155",
        fontWeight: "600",
    },

    itemsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    itemsCount: {
        color: "#64748B",
        fontSize: 12,
        fontWeight: "600",
    },

    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },

    itemMain: {
        flex: 1,
        paddingRight: 10,
    },

    productName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#334155",
    },

    productMeta: {
        marginTop: 4,
        color: "#94A3B8",
        fontSize: 12,
    },

    itemRight: {
        alignItems: "flex-end",
    },

    itemTotal: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },

    itemProfit: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: "700",
        color: "#16A34A",
    },

    itemLoss: {
        color: "#DC2626",
    },

    moneyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    moneyLabel: {
        color: "#64748B",
        fontSize: 14,
    },

    moneyValue: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "600",
    },

    separator: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginVertical: 5,
    },

    totalLabel: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    totalValue: {
        fontSize: 17,
        fontWeight: "900",
        color: "#0B1F3A",
    },

    negativeChange: {
        color: "#DC2626",
    },

    profitCard: {
        backgroundColor: "#0B1F3A",
        borderRadius: 20,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    profitTitle: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },

    profitDescription: {
        color: "#94A3B8",
        marginTop: 4,
        fontSize: 11,
    },

    profitAmount: {
        color: "#4ADE80",
        fontSize: 20,
        fontWeight: "900",
    },

    lossAmount: {
        color: "#F87171",
    },
});