import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  getInventoryPredictions,
  InventoryPrediction,
} from "../../services/inventoryPredictionService";

function getStatusColor(status: string) {
  switch (status) {
    case "OutOfStock":
      return "#DC2626";
    case "Critical":
      return "#EF4444";
    case "ReorderSoon":
      return "#F59E0B";
    case "Watch":
      return "#EAB308";
    case "Healthy":
      return "#16A34A";
    default:
      return "#6B7280";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "OutOfStock":
      return "OUT OF STOCK";
    case "Critical":
      return "CRITICAL";
    case "ReorderSoon":
      return "REORDER SOON";
    case "Watch":
      return "WATCH";
    case "Healthy":
      return "HEALTHY";
    default:
      return status.toUpperCase();
  }
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
}

function PredictionCard({
  item,
  onPress,
}: {
  item: InventoryPrediction;
  onPress: () => void;
}) {
  const statusColor = getStatusColor(item.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.productName}</Text>

          {item.productCode ? (
            <Text style={styles.productCode}>
              Code: {item.productCode}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Stock</Text>
          <Text style={styles.statValue}>{item.currentStock}</Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>7-Day Demand</Text>
          <Text style={styles.statValue}>
            {formatNumber(item.predictedDemand7Days)}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={styles.statLabel}>Stockout</Text>
          <Text style={styles.statValue}>
            {item.currentStock <= 0
              ? "Now"
              : `${formatNumber(item.daysUntilStockout)}d`}
          </Text>
        </View>
      </View>

      <View style={styles.orderBox}>
        <View>
          <Text style={styles.orderLabel}>
            Recommended Order
          </Text>

          <Text style={styles.orderValue}>
            {item.recommendedOrderQuantity} units
          </Text>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>
            Confidence
          </Text>

          <Text style={styles.confidenceValue}>
            {item.forecastConfidence}%
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View>
          <Text style={styles.detailLabel}>Demand Trend</Text>
          <Text style={styles.detailValue}>
            {item.demandTrend}
          </Text>
        </View>

        <View style={styles.detailRight}>
          <Text style={styles.detailLabel}>Peak Day</Text>
          <Text style={styles.detailValue}>
            {item.peakSalesDay}
          </Text>
        </View>
      </View>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Recommendation</Text>
        <Text style={styles.reasonText}>
          {item.recommendationReason}
        </Text>
      </View>

      <Text style={styles.viewDetails}>
        View full analysis →
      </Text>
    </TouchableOpacity>
  );
}

export default function AdminInventoryPrediction() {
  const router = useRouter();

  const [predictions, setPredictions] = useState<
    InventoryPrediction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPredictions = async () => {
    try {
      setError("");

      const data = await getInventoryPredictions();

      setPredictions(data);
    } catch (err) {
      console.error(
        "Failed to load inventory predictions:",
        err
      );

      setError(
        "Unable to load inventory predictions. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPredictions();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  const outOfStockCount = predictions.filter(
    (p) => p.status === "OutOfStock"
  ).length;

  const criticalCount = predictions.filter(
    (p) => p.status === "Critical"
  ).length;

  const reorderSoonCount = predictions.filter(
    (p) => p.status === "ReorderSoon"
  ).length;

  const watchCount = predictions.filter(
    (p) => p.status === "Watch"
  ).length;

  const healthyCount = predictions.filter(
    (p) => p.status === "Healthy"
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Analysing inventory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Smart Inventory</Text>

          <Text style={styles.subtitle}>
            AI-powered stock predictions
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Inventory Health
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: "#DC2626" },
              ]}
            />

            <Text style={styles.summaryNumber}>
              {outOfStockCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Out of Stock
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: "#EF4444" },
              ]}
            />

            <Text style={styles.summaryNumber}>
              {criticalCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Critical
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: "#F59E0B" },
              ]}
            />

            <Text style={styles.summaryNumber}>
              {reorderSoonCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Reorder Soon
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: "#EAB308" },
              ]}
            />

            <Text style={styles.summaryNumber}>
              {watchCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Watch
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryDot,
                { backgroundColor: "#16A34A" },
              ]}
            />

            <Text style={styles.summaryNumber}>
              {healthyCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Healthy
            </Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadPredictions}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={predictions}
        keyExtractor={(item) =>
          item.productId.toString()
        }
        renderItem={({ item }) => (
          <PredictionCard
            item={item}
  onPress={() =>
  router.push(
    `/admin/inventory-prediction/${item.productId}`
  )
}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No inventory predictions
            </Text>

            <Text style={styles.emptyText}>
              There are currently no active products to analyse.
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
    backgroundColor: "#F5F7FA",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  refreshText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "600",
  },

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryItem: {
    alignItems: "center",
    flex: 1,
  },

  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },

  summaryNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  summaryLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 3,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  productInfo: {
    flex: 1,
    paddingRight: 10,
  },

  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  productCode: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 13,
    marginBottom: 13,
  },

  stat: {
    flex: 1,
  },

  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  orderBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  orderLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  orderValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  confidenceContainer: {
    alignItems: "flex-end",
  },

  confidenceLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  confidenceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  detailRight: {
    alignItems: "flex-end",
  },

  detailLabel: {
    fontSize: 11,
    color: "#6B7280",
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 3,
  },

  reasonBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 11,
    marginBottom: 13,
  },

  reasonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },

  reasonText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#374151",
  },

  viewDetails: {
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },

  errorText: {
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 19,
  },

  retryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#991B1B",
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6B7280",
    lineHeight: 20,
  },
});
