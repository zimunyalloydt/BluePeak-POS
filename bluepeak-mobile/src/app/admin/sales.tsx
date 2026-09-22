import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useResponsive } from "../../utils/responsive";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ArrowLeft,
    Search,
    Receipt,
    TrendingUp,
    ShoppingCart,
    ChevronRight,
    CreditCard,
    Banknote,
} from "lucide-react-native";

import { getAdminSales } from "../../services/adminService";

type Sale = {
    saleId: number;
    saleDate: string;
    cashier: string;
    items: number;
    paymentMethod: string;
    total: number;
    profit: number;
};

type Filter = "today" | "week" | "month" | "year";

function formatCurrency(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateString: string) {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
    });
}

function formatTime(dateString: string) {
    const date = new Date(dateString);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

    function SummaryCard({
    title,
    value,
    icon,
    isTablet,
    isLargeTablet,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    isTablet: boolean;
    isLargeTablet: boolean;
}) {
    return (
       <View
    style={[
        styles.summaryCard,
        {
            width: isLargeTablet
                ? "23.5%"
                : isTablet
                    ? "48.5%"
                    : "48%",
        },
    ]}
>
            <View style={styles.summaryIcon}>
                {icon}
            </View>

            <Text style={styles.summaryTitle}>
                {title}
            </Text>

            <Text style={styles.summaryValue}>
                {value}
            </Text>
        </View>
    );
}

export default function AdminSales() {
    const router = useRouter();
const {
    isTablet,
    isLargeTablet,
    horizontalPadding,
    contentMaxWidth,
} = useResponsive();
    const [sales, setSales] = useState<Sale[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("today");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSales = useCallback(async () => {
        try {
            const data = await getAdminSales();

            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load admin sales:", error);

            Alert.alert(
                "Unable to load sales",
                "Please check your connection and try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSales();
        }, [loadSales])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadSales();
    };

    const filteredSales = useMemo(() => {
        const now = new Date();

        return sales.filter((sale) => {
            const saleDate = new Date(sale.saleDate);

            let matchesDate = true;

            if (filter === "today") {
                matchesDate =
                    saleDate.toDateString() ===
                    now.toDateString();
            }

            if (filter === "week") {
                const difference =
                    now.getTime() - saleDate.getTime();

                const days =
                    difference /
                    (1000 * 60 * 60 * 24);

                matchesDate = days >= 0 && days <= 7;
            }

            if (filter === "month") {
                matchesDate =
                    saleDate.getMonth() === now.getMonth() &&
                    saleDate.getFullYear() === now.getFullYear();
            }

            if (filter === "year") {
                matchesDate =
                    saleDate.getFullYear() ===
                    now.getFullYear();
            }

            const searchValue = search
                .trim()
                .toLowerCase();

            const matchesSearch =
                searchValue === "" ||
                sale.saleId
                    .toString()
                    .includes(searchValue) ||
                sale.cashier
                    .toLowerCase()
                    .includes(searchValue) ||
                sale.paymentMethod
                    .toLowerCase()
                    .includes(searchValue);

            return matchesDate && matchesSearch;
        });
    }, [sales, filter, search]);

    const summary = useMemo(() => {
        const revenue = filteredSales.reduce(
            (sum, sale) => sum + Number(sale.total || 0),
            0
        );

        const profit = filteredSales.reduce(
            (sum, sale) => sum + Number(sale.profit || 0),
            0
        );

        const transactions = filteredSales.length;

        const averageSale =
            transactions === 0
                ? 0
                : revenue / transactions;

        return {
            revenue,
            profit,
            transactions,
            averageSale,
        };
    }, [filteredSales]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#1769E0"
                />

                <Text style={styles.loadingText}>
                    Loading sales...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                style={{
                    paddingHorizontal: horizontalPadding,
                  
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1769E0"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
               <View
    style={[
        styles.header,
        {
            maxWidth: contentMaxWidth,
            alignSelf: "center",
            width: "100%",
        },
    ]}
>
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
                            Sales
                        </Text>

                        <Text style={styles.subtitle}>
                            Monitor transactions and revenue
                        </Text>
                    </View>
                </View>

                {/* Summary */}
              <View
    style={[
        styles.summaryGrid,
        {
            maxWidth: contentMaxWidth,
            alignSelf: "center",
            width: "100%",
        },
    ]}
>
                    <SummaryCard
                        title="Revenue"
                        value={formatCurrency(summary.revenue)}
                        icon={
                            <TrendingUp
                                size={20}
                                color="#1769E0"
                            />
                        }
                        isTablet={isTablet}
                        isLargeTablet={isLargeTablet}
                    />

                    <SummaryCard
                        title="Profit"
                        value={formatCurrency(summary.profit)}
                        icon={
                            <TrendingUp
                                size={20}
                                color="#16A34A"
                            />
                        }
                        isTablet={isTablet}
                        isLargeTablet={isLargeTablet}
                    />

                    <SummaryCard
                        title="Transactions"
                        value={summary.transactions.toString()}
                        icon={
                            <Receipt
                                size={20}
                                color="#7C3AED"
                            />
                        }
                        isTablet={isTablet}
                        isLargeTablet={isLargeTablet}
                    />

                    <SummaryCard
                        title="Average Sale"
                        value={formatCurrency(
                            summary.averageSale
                        )}
                        icon={
                            <ShoppingCart
                                size={20}
                                color="#EA580C"
                            />
                        }
                        isTablet={isTablet}
                        isLargeTablet={isLargeTablet}
                    />
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search
                        size={20}
                        color="#64748B"
                    />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search sale ID, cashier..."
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                    />
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={
                        styles.filterContainer
                    }
                >
                    {(
                        [
                            ["today", "Today"],
                            ["week", "Week"],
                            ["month", "Month"],
                            ["year", "Year"],
                        ] as [Filter, string][]
                    ).map(([value, label]) => (
                        <Pressable
                            key={value}
                            onPress={() => setFilter(value)}
                            style={[
                                styles.filterButton,
                                filter === value &&
                                    styles.filterButtonActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === value &&
                                        styles.filterTextActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Sales */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Transactions
                    </Text>

                    <Text style={styles.resultCount}>
                        {filteredSales.length} found
                    </Text>
                </View>

                {filteredSales.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Receipt
                            size={42}
                            color="#CBD5E1"
                        />

                        <Text style={styles.emptyTitle}>
                            No sales found
                        </Text>

                        <Text style={styles.emptyText}>
                            Try another date range or search.
                        </Text>
                    </View>
                ) : (
                    filteredSales.map((sale) => {
                        const isLoss =
                            Number(sale.profit) < 0;

                        return (
                            <Pressable
                                key={sale.saleId}
                                onPress={() =>
                                    router.push(
                                        `/admin/sales/${sale.saleId}`
                                    )
                                }
                                style={({ pressed }) => [
                                    styles.saleCard,
                                    pressed &&
                                        styles.saleCardPressed,
                                ]}
                            >
                                <View style={styles.saleTop}>
                                    <View>
                                        <Text
                                            style={
                                                styles.saleNumber
                                            }
                                        >
                                            Sale #{sale.saleId}
                                        </Text>

                                        <Text
                                            style={
                                                styles.cashier
                                            }
                                        >
                                            {sale.cashier}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.totalContainer
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.saleTotal
                                            }
                                        >
                                            {formatCurrency(
                                                sale.total
                                            )}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.profit,
                                                isLoss &&
                                                    styles.loss,
                                            ]}
                                        >
                                            {isLoss
                                                ? "-"
                                                : "+"}
                                            {formatCurrency(
                                                Math.abs(
                                                    Number(
                                                        sale.profit
                                                    )
                                                )
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.saleBottom}>
                                    <View
                                        style={
                                            styles.infoGroup
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            DATE
                                        </Text>

                                        <Text
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            {formatDate(
                                                sale.saleDate
                                            )}{" "}
                                            •{" "}
                                            {formatTime(
                                                sale.saleDate
                                            )}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.infoGroup
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            ITEMS
                                        </Text>

                                        <Text
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            {sale.items}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.paymentBadge
                                        }
                                    >
                                        {sale.paymentMethod
                                            ?.toLowerCase() ===
                                        "cash" ? (
                                            <Banknote
                                                size={14}
                                                color="#166534"
                                            />
                                        ) : (
                                            <CreditCard
                                                size={14}
                                                color="#1D4ED8"
                                            />
                                        )}

                                        <Text
                                            style={
                                                styles.paymentText
                                            }
                                        >
                                            {
                                                sale.paymentMethod
                                            }
                                        </Text>
                                    </View>

                                    <ChevronRight
                                        size={20}
                                        color="#94A3B8"
                                    />
                                </View>
                            </Pressable>
                        );
                    })
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

    content: {
        padding: 20,
        paddingBottom: 40,
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
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
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

    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 18,
    },

    summaryCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 15,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    summaryIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    summaryTitle: {
        fontSize: 12,
        color: "#64748B",
    },

    summaryValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
        marginTop: 4,
    },

    searchContainer: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: "#111827",
    },

    filterContainer: {
        gap: 8,
        paddingBottom: 18,
    },

    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    filterButtonActive: {
        backgroundColor: "#1769E0",
        borderColor: "#1769E0",
    },

    filterText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#475569",
    },

    filterTextActive: {
        color: "#FFFFFF",
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

    saleCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 17,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        elevation: 2,
    },

    saleCardPressed: {
        opacity: 0.75,
    },

    saleTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    saleNumber: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },

    cashier: {
        marginTop: 5,
        fontSize: 13,
        color: "#64748B",
    },

    totalContainer: {
        alignItems: "flex-end",
    },

    saleTotal: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    profit: {
        marginTop: 3,
        fontSize: 12,
        fontWeight: "700",
        color: "#16A34A",
    },

    loss: {
        color: "#DC2626",
    },

    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 14,
    },

    saleBottom: {
        flexDirection: "row",
        alignItems: "center",
    },

    infoGroup: {
        marginRight: 14,
    },

    infoLabel: {
        fontSize: 9,
        fontWeight: "800",
        color: "#94A3B8",
        marginBottom: 3,
    },

    infoValue: {
        fontSize: 12,
        color: "#475569",
        fontWeight: "600",
    },

    paymentBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: "auto",
        marginRight: 8,
    },

    paymentText: {
        marginLeft: 4,
        fontSize: 10,
        fontWeight: "700",
        color: "#166534",
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
    },

    emptyText: {
        marginTop: 6,
        color: "#94A3B8",
        textAlign: "center",
        fontSize: 13,
    },
});