import api from "./api";

export interface InventoryPrediction {
  productId: number;
  productName: string;
  productCode?: string | null;

  currentStock: number;
  reorderLevel: number;
  reorderQuantity: number;
  supplierLeadTimeDays: number;

  unitsSoldLast7Days: number;
  unitsSoldLast30Days: number;

  averageDailySales7Days: number;
  averageDailySales30Days: number;
  weightedDailySales: number;

  predictedDemand7Days: number;
  daysUntilStockout: number;

  recommendedOrderQuantity: number;

  unitsSoldPrevious7Days: number;
  salesGrowthPercentage: number;

  averageMondaySales: number;
  averageTuesdaySales: number;
  averageWednesdaySales: number;
  averageThursdaySales: number;
  averageFridaySales: number;
  averageSaturdaySales: number;
  averageSundaySales: number;

  peakSalesDay: string;
  peakSalesDayAverage: number;

  slowestSalesDay: string;
  slowestSalesDayAverage: number;

  demandTrend: string;
  forecastMethod: string;
  weekdayAdjustedDemand7Days: number;

  targetStockDays: number;
  forecastConfidence: number;
  targetStockLevel: number;

  recommendationReason: string;
  dataQuality: string;
  status: string;
}

export async function getInventoryPredictions(): Promise<
  InventoryPrediction[]
> {
  const response = await api.get<InventoryPrediction[]>(
    "/InventoryPrediction"
  );

  return response.data;
}

export async function getInventoryPrediction(
  productId: number
): Promise<InventoryPrediction> {
  const response = await api.get<InventoryPrediction>(
    `/InventoryPrediction/${productId}`
  );

  return response.data;
}