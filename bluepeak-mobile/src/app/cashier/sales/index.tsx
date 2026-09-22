import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import {
    getMySales,
    SaleHistory,
} from "../../../services/cashierSalesService";

export default function CashierSalesScreen() {
    const router = useRouter();

    const [sales, setSales] = useState<SaleHistory[]>(
        []
    );

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [search, setSearch] = useState("");

    const loadSales = useCallback(async () => {
        try {
            const data = await getMySales();

            setSales(data);
        } catch (error) {
            console.error(
                "Failed to load cashier sales:",
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSales();
    }, [loadSales]);

    const filteredSales = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        if (!query) {
            return sales;
        }

        return sales.filter((sale) =>
            sale.saleId
                .toString()
                .includes(query)
        );
    }, [sales, search]);

    const totalSales = useMemo(() => {
        return sales.reduce(
            (sum, sale) =>
                sum + Number(sale.total || 0),
            0
        );
    }, [sales]);

    const todaySales = useMemo(() => {
        const today =
            new Date().toDateString();

        return sales
            .filter(
                (sale) =>
                    new Date(
                        sale.saleDate
                    ).toDateString() === today
            )
            .reduce(
                (sum, sale) =>
                    sum + Number(sale.total || 0),
                0
            );
    }, [sales]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSales();
    };

    const renderSale = ({
        item,
    }: {
        item: SaleHistory;
    }) => {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.saleCard,
                    pressed &&
                        styles.saleCardPressed,
                ]}
                onPress={() =>
                    router.push(
                        `/cashier/sales/${item.saleId}`
                    )
                }
            >
                <View style={styles.saleTop}>
                    <View>
                        <Text
                            style={
                                styles.saleNumber
                            }
                        >
                            Sale #{item.saleId}
                        </Text>

                        <Text
                            style={
                                styles.saleDate
                            }
                        >
                            {new Date(
                                item.saleDate
                            ).toLocaleString()}
                        </Text>
                    </View>

                    <Text style={styles.saleTotal}>
                        ${Number(
                            item.total
                        ).toFixed(2)}
                    </Text>
                </View>

                <View style={styles.saleBottom}>
                    <Text style={styles.saleInfo}>
                        {item.itemCount}{" "}
                        {item.itemCount === 1
                            ? "item"
                            : "items"}
                    </Text>

                    <Text style={styles.saleInfo}>
                        {item.paymentMethod}
                    </Text>

                    <View
                        style={
                            styles.statusBadge
                        }
                    >
                        <Text
                            style={
                                styles.statusText
                            }
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
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
                        Loading sales...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.title}>
                    My Sales
                </Text>

                <Text style={styles.subtitle}>
                    Sales processed by you
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        TODAY
                    </Text>

                    <Text
                        style={
                            styles.summaryValue
                        }
                    >
                        ${todaySales.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        TRANSACTIONS
                    </Text>

                    <Text
                        style={
                            styles.summaryValue
                        }
                    >
                        {sales.length}
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <Text
                        style={
                            styles.summaryLabel
                        }
                    >
                        TOTAL
                    </Text>

                    <Text
                        style={
                            styles.summaryValue
                        }
                    >
                        ${totalSales.toFixed(2)}
                    </Text>
                </View>
            </View>

            <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search sale number..."
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                style={styles.search}
            />

            <FlatList
                data={filteredSales}
                keyExtractor={(item) =>
                    item.saleId.toString()
                }
                renderItem={renderSale}
                contentContainerStyle={
                    styles.listContent
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                ListEmptyComponent={
                    <View
                        style={
                            styles.emptyContainer
                        }
                    >
                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No sales found
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Your completed sales
                            will appear here.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 12,
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    subtitle: {
        marginTop: 4,
        color: "#64748B",
        fontSize: 14,
    },

    summaryRow: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 14,
    },

    summaryCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    summaryLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#64748B",
    },

    summaryValue: {
        marginTop: 6,
        fontSize: 17,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    search: {
        marginHorizontal: 20,
        marginBottom: 10,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: "#0F172A",
    },

    listContent: {
        padding: 20,
        paddingTop: 4,
        paddingBottom: 40,
    },

    saleCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    saleCardPressed: {
        opacity: 0.7,
    },

    saleTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    saleNumber: {
        fontSize: 17,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    saleDate: {
        marginTop: 4,
        fontSize: 12,
        color: "#64748B",
    },

    saleTotal: {
        fontSize: 20,
        fontWeight: "900",
        color: "#1769E0",
    },

    saleBottom: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 14,
    },

    saleInfo: {
        fontSize: 12,
        color: "#475569",
    },

    statusBadge: {
        marginLeft: "auto",
        backgroundColor: "#DCFCE7",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },

    statusText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#166534",
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

    emptyContainer: {
        alignItems: "center",
        paddingTop: 60,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0B1F3A",
    },

    emptyText: {
        marginTop: 6,
        color: "#64748B",
    },
});