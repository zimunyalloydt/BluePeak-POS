import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  getInventoryPrediction,
  InventoryPrediction,
} from "../../../services/inventoryPredictionService";

function getStatusLabel(status: string) {
  switch (status) {
    case "OutOfStock":
      return "OUT OF STOCK";
    case "Critical":
      return "CRITICAL";
    case "LowStock":
      return "LOW STOCK";
    case "Watch":
      return "WATCH";
    case "Healthy":
      return "HEALTHY";
    default:
      return status.toUpperCase();
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "OutOfStock":
      return "#DC2626";
    case "Critical":
      return "#EA580C";
    case "LowStock":
      return "#D97706";
    case "Watch":
      return "#2563EB";
    case "Healthy":
      return "#16A34A";
    default:
      return "#64748B";
  }
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2);
}

function formatPercentage(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {description ? (
        <Text style={styles.metricDescription}>{description}</Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function InventoryPredictionDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{
    productId: string;
  }>();

  const [prediction, setPrediction] =
    useState<InventoryPrediction | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPrediction = useCallback(async () => {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const data = await getInventoryPrediction(
        Number(productId)
      );

      setPrediction(data);
    } catch (err) {
      console.error(
        "Failed to load inventory prediction:",
        err
      );

      setError(
        "Unable to load the inventory analysis."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      loadPrediction();
    }, [loadPrediction])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPrediction();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1769E0" />
        <Text style={styles.loadingText}>
          Loading inventory analysis...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !prediction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Analysis unavailable
          </Text>

          <Text style={styles.errorText}>
            {error || "No inventory prediction was found."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadPrediction}
          >
            <Text style={styles.retryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(prediction.status);

  const weekdayData = [
    {
      day: "Monday",
      value: prediction.averageMondaySales,
    },
    {
      day: "Tuesday",
      value: prediction.averageTuesdaySales,
    },
    {
      day: "Wednesday",
      value: prediction.averageWednesdaySales,
    },
    {
      day: "Thursday",
      value: prediction.averageThursdaySales,
    },
    {
      day: "Friday",
      value: prediction.averageFridaySales,
    },
    {
      day: "Saturday",
      value: prediction.averageSaturdaySales,
    },
    {
      day: "Sunday",
      value: prediction.averageSundaySales,
    },
  ];

  const maxWeekdaySales = Math.max(
    ...weekdayData.map((item) => item.value),
    1
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Full Analysis
            </Text>

            <Text style={styles.headerSubtitle}>
              Smart Inventory Prediction
            </Text>
          </View>
        </View>

        {/* Product Header */}
        <View style={styles.productCard}>
          <View style={styles.productHeaderRow}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {prediction.productName}
              </Text>

              {prediction.productCode ? (
                <Text style={styles.productCode}>
                  Code: {prediction.productCode}
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
                {getStatusLabel(prediction.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Forecast Overview
          </Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              label="Current Stock"
              value={formatNumber(prediction.currentStock)}
              description="units available"
            />

            <MetricCard
              label="7-Day Demand"
              value={formatNumber(
                prediction.predictedDemand7Days
              )}
              description="predicted units"
            />

            <MetricCard
              label="Recommended Order"
              value={formatNumber(
                prediction.recommendedOrderQuantity
              )}
              description="units to order"
            />

            <MetricCard
              label="Target Stock"
              value={formatNumber(
                prediction.targetStockLevel
              )}
              description="desired stock level"
            />
          </View>
        </View>

        {/* Stock Risk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Stock Risk
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Reorder Level"
              value={`${prediction.reorderLevel} units`}
            />

            <InfoRow
              label="Days Until Stockout"
              value={`${formatNumber(
                prediction.daysUntilStockout
              )} days`}
            />

            <InfoRow
              label="Supplier Lead Time"
              value={`${prediction.supplierLeadTimeDays} days`}
            />

            <InfoRow
              label="Target Coverage"
              value={`${prediction.targetStockDays} days`}
            />

            <InfoRow
              label="Standard Reorder Quantity"
              value={`${prediction.reorderQuantity} units`}
            />
          </View>
        </View>

        {/* Sales Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sales Performance
          </Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              label="Last 7 Days"
              value={formatNumber(
                prediction.unitsSoldLast7Days
              )}
              description="units sold"
            />

            <MetricCard
              label="Last 30 Days"
              value={formatNumber(
                prediction.unitsSoldLast30Days
              )}
              description="units sold"
            />

            <MetricCard
              label="Previous 7 Days"
              value={formatNumber(
                prediction.unitsSoldPrevious7Days
              )}
              description="units sold"
            />

            <MetricCard
              label="Sales Growth"
              value={formatPercentage(
                prediction.salesGrowthPercentage
              )}
              description="recent trend"
            />
          </View>
        </View>

        {/* Demand Intelligence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Demand Intelligence
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Demand Trend"
              value={prediction.demandTrend}
            />

            <InfoRow
              label="Peak Sales Day"
              value={`${prediction.peakSalesDay} (${formatNumber(
                prediction.peakSalesDayAverage
              )} units/day)`}
            />

            <InfoRow
              label="Slowest Sales Day"
              value={`${prediction.slowestSalesDay} (${formatNumber(
                prediction.slowestSalesDayAverage
              )} units/day)`}
            />

            <InfoRow
              label="Weighted Daily Sales"
              value={`${formatNumber(
                prediction.weightedDailySales
              )} units/day`}
            />

            <InfoRow
              label="7-Day Average"
              value={`${formatNumber(
                prediction.averageDailySales7Days
              )} units/day`}
            />

            <InfoRow
              label="30-Day Average"
              value={`${formatNumber(
                prediction.averageDailySales30Days
              )} units/day`}
            />

            <InfoRow
              label="Weekday-Adjusted Forecast"
              value={`${formatNumber(
                prediction.weekdayAdjustedDemand7Days
              )} units`}
            />
          </View>
        </View>

        {/* Weekly Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Weekly Sales Pattern
          </Text>

          <View style={styles.weekdayCard}>
            {weekdayData.map((item) => {
              const percentage =
                (item.value / maxWeekdaySales) * 100;

              return (
                <View
                  key={item.day}
                  style={styles.weekdayRow}
                >
                  <View style={styles.weekdayLabelContainer}>
                    <Text style={styles.weekdayLabel}>
                      {item.day}
                    </Text>

                    <Text style={styles.weekdayValue}>
                      {formatNumber(item.value)}
                    </Text>
                  </View>

                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Forecast Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Forecast Quality
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Confidence"
              value={`${prediction.forecastConfidence}%`}
            />

            <InfoRow
              label="Data Quality"
              value={prediction.dataQuality}
            />

            <InfoRow
              label="Forecast Method"
              value={prediction.forecastMethod}
            />
          </View>

          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>
                Forecast Confidence
              </Text>

              <Text style={styles.confidenceValue}>
                {prediction.forecastConfidence}%
              </Text>
            </View>

            <View style={styles.confidenceBackground}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${Math.min(
                      Math.max(
                        prediction.forecastConfidence,
                        0
                      ),
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            BluePeak Recommendation
          </Text>

          <View
            style={[
              styles.recommendationCard,
              { borderLeftColor: statusColor },
            ]}
          >
            <Text style={styles.recommendationTitle}>
              Recommended Action
            </Text>

            <Text style={styles.recommendationText}>
              {prediction.recommendationReason}
            </Text>

            <View style={styles.orderBox}>
              <Text style={styles.orderBoxLabel}>
                Recommended Order
              </Text>

              <Text style={styles.orderBoxValue}>
                {prediction.recommendedOrderQuantity} units
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
  },

  header: {
    backgroundColor: "#0B1F3A",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 36,
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#B9C7DA",
    fontSize: 13,
    marginTop: 3,
  },

  productCard: {
    margin: 16,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  productHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  productInfo: {
    flex: 1,
    paddingRight: 12,
  },

  productName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  productCode: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  metricCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    minHeight: 105,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  metricLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },

  metricDescription: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  infoRow: {
    minHeight: 52,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    flex: 1,
    color: "#64748B",
    fontSize: 13,
    paddingRight: 12,
  },

  infoValue: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },

  weekdayCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  weekdayRow: {
    marginBottom: 14,
  },

  weekdayLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  weekdayLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },

  weekdayValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },

  barBackground: {
    height: 9,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    backgroundColor: "#1769E0",
    borderRadius: 5,
  },

  confidenceContainer: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },

  confidenceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  confidenceLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  confidenceValue: {
    color: "#1769E0",
    fontSize: 16,
    fontWeight: "800",
  },

  confidenceBackground: {
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    overflow: "hidden",
  },

  confidenceFill: {
    height: "100%",
    backgroundColor: "#1769E0",
    borderRadius: 5,
  },

  recommendationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderLeftWidth: 5,
    padding: 17,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  recommendationTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  recommendationText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  orderBox: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  orderBoxLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  orderBoxValue: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "800",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: "#1769E0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  bottomSpace: {
    height: 35,
  },
});