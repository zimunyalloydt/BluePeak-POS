import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
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

const DateTimePickerComponent: any = (() => {
    try {
        return require("@react-native-community/datetimepicker")
            .default;
    } catch {
        console.warn(
            "@react-native-community/datetimepicker is not installed; date filters are disabled."
        );
        return null;
    }
})();

import {
    ArrowLeft,
    Search,
    Receipt,
    TrendingUp,
    ShoppingCart,
    ChevronRight,
    CreditCard,
    Banknote,
    CalendarDays,
    X,
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

type Filter = "today" | "week" | "month" | "year" | "custom";

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

function formatFilterDate(date: Date) {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// Strip time from a date so comparisons are day-based, not ms-based.
function startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
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
            <View style={styles.summaryIcon}>{icon}</View>

            <Text style={styles.summaryTitle}>{title}</Text>

            <Text style={styles.summaryValue}>{value}</Text>
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

    // --- Load sales ---
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

    // Which picker is open: null | "from" | "to"

 

    // Which picker is open: null | "from" | "to"
    
// --- Custom date range ---
const [fromDate, setFromDate] = useState<Date | null>(null);
const [toDate, setToDate] = useState<Date | null>(null);

// Temporary date while the picker is open.
// This is important on iOS because the user should be able
// to spin/select the date and then press Apply.
const [tempDate, setTempDate] = useState<Date>(new Date());

const [pickerMode, setPickerMode] = useState<"from" | "to" | null>(
    null
);

const [showPicker, setShowPicker] = useState(false);

const openFromPicker = () => {
    setPickerMode("from");

    setTempDate(
        fromDate ??
            toDate ??
            new Date()
    );

    setShowPicker(true);
};

const openToPicker = () => {
    setPickerMode("to");

    setTempDate(
        toDate ??
            fromDate ??
            new Date()
    );

    setShowPicker(true);
};

const closePicker = () => {
    setShowPicker(false);
    setPickerMode(null);
};

const onPickerChange = (
    event: any,
    selectedDate?: Date
) => {
    // Android:
    // If the user cancels, simply close the picker.
    if (Platform.OS === "android") {
        if (event?.type === "dismissed") {
            closePicker();
            return;
        }

        if (!selectedDate) {
            closePicker();
            return;
        }

        const selected = new Date(selectedDate);

        if (pickerMode === "from") {
            const nextFrom = startOfDay(selected);

            setFromDate(nextFrom);

            if (toDate && nextFrom > toDate) {
                setToDate(endOfDay(selected));
            }

            setFilter("custom");
        }

        if (pickerMode === "to") {
            const nextTo = endOfDay(selected);

            setToDate(nextTo);

            if (fromDate && nextTo < fromDate) {
                setFromDate(startOfDay(selected));
            }

            setFilter("custom");
        }

        closePicker();
        return;
    }

    // iOS:
    // DO NOT close the modal here.
    // Just update the temporary date.
    if (selectedDate) {
        setTempDate(new Date(selectedDate));
    }
};

const applyPickerDate = () => {
    if (!pickerMode) {
        return;
    }

    const selected = new Date(tempDate);

    if (pickerMode === "from") {
        const nextFrom = startOfDay(selected);

        setFromDate(nextFrom);

        if (toDate && nextFrom > toDate) {
            setToDate(endOfDay(selected));
        }
    }

    if (pickerMode === "to") {
        const nextTo = endOfDay(selected);

        setToDate(nextTo);

        if (fromDate && nextTo < fromDate) {
            setFromDate(startOfDay(selected));
        }
    }

    closePicker();
};

const applyCustomRange = () => {
    if (!fromDate || !toDate) {
        Alert.alert(
            "Pick a date range",
            "Choose both a start and end date."
        );
        return;
    }

    if (fromDate > toDate) {
        Alert.alert(
            "Invalid date range",
            "The start date cannot be after the end date."
        );
        return;
    }

    setFilter("custom");
};

const clearCustomRange = () => {
    setFromDate(null);
    setToDate(null);
    setFilter("today");
};
    const onRefresh = () => {
        setRefreshing(true);
        loadSales();
    };


    // ---- Filtering ----

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
                    difference / (1000 * 60 * 60 * 24);

                matchesDate = days >= 0 && days <= 7;
            }

            if (filter === "month") {
                matchesDate =
                    saleDate.getMonth() === now.getMonth() &&
                    saleDate.getFullYear() ===
                        now.getFullYear();
            }

            if (filter === "year") {
                matchesDate =
                    saleDate.getFullYear() ===
                    now.getFullYear();
            }

            if (filter === "custom") {
                if (!fromDate || !toDate) {
                    matchesDate = false;
                } else {
                    const t = saleDate.getTime();
                    matchesDate =
                        t >= fromDate.getTime() &&
                        t <= toDate.getTime();
                }
            }

            const searchValue = search
                .trim()
                .toLowerCase();

            const matchesSearch =
                searchValue === "" ||
                sale.saleId.toString().includes(searchValue) ||
                sale.cashier
                    .toLowerCase()
                    .includes(searchValue) ||
                sale.paymentMethod
                    .toLowerCase()
                    .includes(searchValue);

            return matchesDate && matchesSearch;
        });
    }, [sales, filter, search, fromDate, toDate]);

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
            transactions === 0 ? 0 : revenue / transactions;

        return { revenue, profit, transactions, averageSale };
    }, [filteredSales]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1769E0" />

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
                style={{ paddingHorizontal: horizontalPadding }}
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
                        <ArrowLeft size={22} color="#111827" />
                    </Pressable>

                    <View>
                        <Text style={styles.title}>Sales</Text>

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
                            <Receipt size={20} color="#7C3AED" />
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
                <View
                    style={[
                        styles.searchContainer,
                        {
                            maxWidth: contentMaxWidth,
                            alignSelf: "center",
                            width: "100%",
                        },
                    ]}
                >
                    <Search size={20} color="#64748B" />

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
                    contentContainerStyle={styles.filterContainer}
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

                    <Pressable
                        onPress={openFromPicker}
                        style={[
                            styles.filterButton,
                            styles.filterButtonDate,
                            filter === "custom" &&
                                styles.filterButtonActive,
                        ]}
                    >
                        <CalendarDays
                            size={14}
                            color={
                                filter === "custom"
                                    ? "#FFFFFF"
                                    : "#475569"
                            }
                        />
                        <Text
                            style={[
                                styles.filterText,
                                styles.filterTextDate,
                                filter === "custom" &&
                                    styles.filterTextActive,
                            ]}
                        >
                            {fromDate
                                ? formatFilterDate(fromDate)
                                : "From"}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={openToPicker}
                        style={[
                            styles.filterButton,
                            styles.filterButtonDate,
                            filter === "custom" &&
                                styles.filterButtonActive,
                        ]}
                    >
                        <CalendarDays
                            size={14}
                            color={
                                filter === "custom"
                                    ? "#FFFFFF"
                                    : "#475569"
                            }
                        />
                        <Text
                            style={[
                                styles.filterText,
                                styles.filterTextDate,
                                filter === "custom" &&
                                    styles.filterTextActive,
                            ]}
                        >
                            {toDate
                                ? formatFilterDate(toDate)
                                : "To"}
                        </Text>
                    </Pressable>

                    {filter === "custom" && (
                        <Pressable
                            onPress={clearCustomRange}
                            style={styles.clearRangeButton}
                        >
                            <X size={14} color="#DC2626" />
                            <Text style={styles.clearRangeText}>
                                Clear
                            </Text>
                        </Pressable>
                    )}
                </ScrollView>

                {/* Active custom range banner */}
                {filter === "custom" && fromDate && toDate && (
                    <View
                        style={[
                            styles.rangeBanner,
                            {
                                maxWidth: contentMaxWidth,
                                alignSelf: "center",
                                width: "100%",
                            },
                        ]}
                    >
                        <CalendarDays size={16} color="#1769E0" />
                        <Text style={styles.rangeBannerText}>
                            Showing{" "}
                            <Text
                                style={styles.rangeBannerStrong}
                            >
                                {formatFilterDate(fromDate)}
                            </Text>{" "}
                            to{" "}
                            <Text
                                style={styles.rangeBannerStrong}
                            >
                                {formatFilterDate(toDate)}
                            </Text>
                        </Text>
                    </View>
                )}

                {/* Sales */}
                <View
                    style={[
                        styles.sectionHeader,
                        {
                            maxWidth: contentMaxWidth,
                            alignSelf: "center",
                            width: "100%",
                        },
                    ]}
                >
                    <Text style={styles.sectionTitle}>
                        Transactions
                    </Text>

                    <Text style={styles.resultCount}>
                        {filteredSales.length} found
                    </Text>
                </View>

                {filteredSales.length === 0 ? (
                    <View
                        style={[
                            styles.emptyCard,
                            {
                                maxWidth: contentMaxWidth,
                                alignSelf: "center",
                                width: "100%",
                            },
                        ]}
                    >
                        <Receipt size={42} color="#CBD5E1" />

                        <Text style={styles.emptyTitle}>
                            No sales found
                        </Text>

                        <Text style={styles.emptyText}>
                            Try another date range or search.
                        </Text>
                    </View>
                ) : (
                    filteredSales.map((sale) => {
                        const isLoss = Number(sale.profit) < 0;

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
                                    {
                                        maxWidth: contentMaxWidth,
                                        alignSelf: "center",
                                        width: "100%",
                                    },
                                ]}
                            >
                                <View style={styles.saleTop}>
                                    <View>
                                        <Text
                                            style={styles.saleNumber}
                                        >
                                            Sale #{sale.saleId}
                                        </Text>

                                        <Text
                                            style={styles.cashier}
                                        >
                                            {sale.cashier}
                                        </Text>
                                    </View>

                                    <View
                                        style={styles.totalContainer}
                                    >
                                        <Text
                                            style={styles.saleTotal}
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
                                            {isLoss ? "-" : "+"}
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
                                    <View style={styles.infoGroup}>
                                        <Text
                                            style={styles.infoLabel}
                                        >
                                            DATE
                                        </Text>

                                        <Text
                                            style={styles.infoValue}
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

                                    <View style={styles.infoGroup}>
                                        <Text
                                            style={styles.infoLabel}
                                        >
                                            ITEMS
                                        </Text>

                                        <Text
                                            style={styles.infoValue}
                                        >
                                            {sale.items}
                                        </Text>
                                    </View>

                                    <View
                                        style={styles.paymentBadge}
                                    >
                                        {sale.paymentMethod?.toLowerCase() ===
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
                                            style={styles.paymentText}
                                        >
                                            {sale.paymentMethod}
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
{/* iOS date picker modal */}
{Platform.OS === "ios" &&
    showPicker &&
    pickerMode &&
    DateTimePickerComponent && (
        <Modal
            visible={true}
            transparent
            animationType="slide"
            onRequestClose={closePicker}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.pickerSheet}>
                    <View style={styles.pickerHeader}>
                        <Pressable
                            onPress={closePicker}
                            style={styles.pickerHeaderButton}
                        >
                            <Text style={styles.pickerCancelText}>
                                Cancel
                            </Text>
                        </Pressable>

                        <Text style={styles.pickerTitle}>
                            {pickerMode === "from"
                                ? "Start Date"
                                : "End Date"}
                        </Text>

                        <Pressable
                            onPress={applyPickerDate}
                            style={styles.pickerHeaderButton}
                        >
                            <Text style={styles.pickerConfirmText}>
                                Done
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.pickerDatePreview}>
                        <CalendarDays
                            size={18}
                            color="#1769E0"
                        />

                        <Text style={styles.pickerDatePreviewText}>
                            {formatFilterDate(tempDate)}
                        </Text>
                    </View>

                    <DateTimePickerComponent
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={onPickerChange}
                        themeVariant="light"
                        textColor="#111827"
                    />

                    <Pressable
                        onPress={applyPickerDate}
                        style={styles.pickerConfirm}
                    >
                        <Text style={styles.pickerConfirmText}>
                            Use this date
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )}

          {/* Android native date picker */}
{Platform.OS === "android" &&
    showPicker &&
    pickerMode &&
    DateTimePickerComponent && (
        <DateTimePickerComponent
            value={tempDate}
            mode="date"
            display="calendar"
            onChange={onPickerChange}
        />
    )}
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
        alignItems: "center",
    },

    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },

    filterButtonDate: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
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

    filterTextDate: {
        fontSize: 12,
    },

    filterTextActive: {
        color: "#FFFFFF",
    },

    clearRangeButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
    },

    clearRangeText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "700",
    },

    rangeBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#EAF1FF",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#D0E1FF",
    },

    rangeBannerText: {
        color: "#0B1F3A",
        fontSize: 13,
    },

    rangeBannerStrong: {
        fontWeight: "800",
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

modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
},

pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
},

pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
},

pickerHeaderButton: {
    minWidth: 70,
    paddingVertical: 8,
},

pickerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B1F3A",
    textAlign: "center",
},

pickerDatePreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EAF1FF",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 8,
},

pickerDatePreviewText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1769E0",
},

pickerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
},

pickerCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
},

pickerCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
},

pickerConfirm: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1769E0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
 
},

pickerConfirmText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
},
});