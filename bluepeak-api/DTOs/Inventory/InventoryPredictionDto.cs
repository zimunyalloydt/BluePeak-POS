namespace bluepeak_api.DTOs.Inventory;

public class InventoryPredictionDto
{
    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string? ProductCode { get; set; }

    public int CurrentStock { get; set; }

    public int ReorderLevel { get; set; }

    public int ReorderQuantity { get; set; }

    public int SupplierLeadTimeDays { get; set; }

    public int UnitsSoldLast7Days { get; set; }

    public int UnitsSoldLast30Days { get; set; }

    public decimal AverageDailySales7Days { get; set; }

    public decimal AverageDailySales30Days { get; set; }

    public decimal WeightedDailySales { get; set; }

    public decimal PredictedDemand7Days { get; set; }

    public decimal DaysUntilStockout { get; set; }

    public int RecommendedOrderQuantity { get; set; }
    public int UnitsSoldPrevious7Days { get; set; }

public decimal SalesGrowthPercentage { get; set; }

public decimal AverageMondaySales { get; set; }
public decimal AverageTuesdaySales { get; set; }
public decimal AverageWednesdaySales { get; set; }
public decimal AverageThursdaySales { get; set; }
public decimal AverageFridaySales { get; set; }
public decimal AverageSaturdaySales { get; set; }
public decimal AverageSundaySales { get; set; }

public string PeakSalesDay { get; set; } = string.Empty;
public decimal PeakSalesDayAverage { get; set; }

public string SlowestSalesDay { get; set; } = string.Empty;
public decimal SlowestSalesDayAverage { get; set; }

public string DemandTrend { get; set; } = string.Empty;
public string ForecastMethod { get; set; } = string.Empty;

public decimal WeekdayAdjustedDemand7Days { get; set; }

public int TargetStockDays { get; set; }
public string DataQuality { get; set; } = string.Empty;


public decimal ForecastConfidence { get; set; }

public int TargetStockLevel { get; set; }

public string RecommendationReason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

