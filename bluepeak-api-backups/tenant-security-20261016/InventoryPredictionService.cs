using bluepeak_api.Data;
using bluepeak_api.DTOs.Inventory;
using bluepeak_api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class InventoryPredictionService : IInventoryPredictionService
{
    private readonly AppDbContext _context;

    public InventoryPredictionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<InventoryPredictionDto>> GetPredictionsAsync()
    {
        var products = await _context.Products
            .Where(p => p.IsActive)
            .ToListAsync();

        var now = DateTime.UtcNow;

        var sevenDaysAgo = now.AddDays(-7);
        var fourteenDaysAgo=now.AddDays(-14);
        var thirtyDaysAgo = now.AddDays(-30);

        var sales = await _context.SaleItems
            .Include(si => si.Sale)
            .Where(si =>
                si.Sale != null &&
                si.Sale.SaleDate >= thirtyDaysAgo)
            .Select(si => new
            {
                si.ProductId,
                si.Quantity,
                SaleDate = si.Sale!.SaleDate
            })
            .ToListAsync();

        var predictions = new List<InventoryPredictionDto>();

        foreach (var product in products)
        {
            var productSales = sales
                .Where(s => s.ProductId == product.ProductId)
                .ToList();

                // -----------------------------------------
// Day-of-week demand intelligence
// -----------------------------------------

var mondaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Monday)
    .Sum(s => s.Quantity);

var tuesdaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Tuesday)
    .Sum(s => s.Quantity);

var wednesdaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Wednesday)
    .Sum(s => s.Quantity);

var thursdaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Thursday)
    .Sum(s => s.Quantity);

var fridaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Friday)
    .Sum(s => s.Quantity);

var saturdaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Saturday)
    .Sum(s => s.Quantity);

var sundaySales = productSales
    .Where(s => s.SaleDate.DayOfWeek == DayOfWeek.Sunday)
    .Sum(s => s.Quantity);

    var mondayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Monday)
    .Distinct()
    .Count();

var tuesdayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Tuesday)
    .Distinct()
    .Count();

var wednesdayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Wednesday)
    .Distinct()
    .Count();

var thursdayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Thursday)
    .Distinct()
    .Count();

var fridayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Friday)
    .Distinct()
    .Count();

var saturdayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Saturday)
    .Distinct()
    .Count();

var sundayDays = productSales
    .Select(s => s.SaleDate.Date)
    .Where(d => d.DayOfWeek == DayOfWeek.Sunday)
    .Distinct()
    .Count();

decimal Average(int total, int days)
{
    return days == 0
        ? 0
        : total / (decimal)days;
}

var averageMondaySales = Average(mondaySales, mondayDays);
var averageTuesdaySales = Average(tuesdaySales, tuesdayDays);
var averageWednesdaySales = Average(wednesdaySales, wednesdayDays);
var averageThursdaySales = Average(thursdaySales, thursdayDays);
var averageFridaySales = Average(fridaySales, fridayDays);
var averageSaturdaySales = Average(saturdaySales, saturdayDays);
var averageSundaySales = Average(sundaySales, sundayDays);

var weekdayAverages = new Dictionary<string, decimal>
{
    ["Monday"] = averageMondaySales,
    ["Tuesday"] = averageTuesdaySales,
    ["Wednesday"] = averageWednesdaySales,
    ["Thursday"] = averageThursdaySales,
    ["Friday"] = averageFridaySales,
    ["Saturday"] = averageSaturdaySales,
    ["Sunday"] = averageSundaySales
};

var peakDay = weekdayAverages
    .OrderByDescending(x => x.Value)
    .First();

var slowestDay = weekdayAverages
    .OrderBy(x => x.Value)
    .First();

var peakSalesDay = peakDay.Key;
var peakSalesDayAverage = peakDay.Value;

var slowestSalesDay = slowestDay.Key;
var slowestSalesDayAverage = slowestDay.Value;

            var unitsSold7Days = productSales
                .Where(s => s.SaleDate >= sevenDaysAgo)
                .Sum(s => s.Quantity);

                var unitsSoldPrevious7Days = productSales
    .Where(s =>
        s.SaleDate >= fourteenDaysAgo &&
        s.SaleDate < sevenDaysAgo)
    .Sum(s => s.Quantity);
 

 decimal salesGrowthPercentage;
string demandTrend;
string dataQuality;

if (unitsSoldPrevious7Days == 0)
{
    if (unitsSold7Days == 0)
    {
        salesGrowthPercentage = 0m;
        demandTrend = "Stable";
        dataQuality = "NoRecentSales";
    }
    else
    {
        salesGrowthPercentage = 0m;
        demandTrend = "New";
        dataQuality = "Limited";
    }
}
else
{
    salesGrowthPercentage =
        ((unitsSold7Days -
          unitsSoldPrevious7Days) /
         (decimal)unitsSoldPrevious7Days) * 100m;

    if (salesGrowthPercentage >= 20)
    {
        demandTrend = "Rising";
    }
    else if (salesGrowthPercentage <= -20)
    {
        demandTrend = "Falling";
    }
    else
    {
        demandTrend = "Stable";
    }

    dataQuality = "Good";
}

            var unitsSold30Days = productSales
                .Sum(s => s.Quantity);

            var averageDaily7Days =
                unitsSold7Days / 7m;

            var averageDaily30Days =
                unitsSold30Days / 30m;

            /*
             * Give recent sales more weight.
             *
             * 70% = recent 7-day demand
             * 30% = 30-day demand
             */
           var weightedDailySales =
    (averageDaily7Days * 0.70m) +
    (averageDaily30Days * 0.30m);

if (salesGrowthPercentage >= 20)
{
    weightedDailySales *= 1.15m;
}
else if (salesGrowthPercentage <= -20)
{
    weightedDailySales *= 0.90m;
}

        // -----------------------------------------
// Intelligent 7-day forecast
// -----------------------------------------

var weekdayAveragesForForecast = new Dictionary<DayOfWeek, decimal>
{
    [DayOfWeek.Monday] = averageMondaySales,
    [DayOfWeek.Tuesday] = averageTuesdaySales,
    [DayOfWeek.Wednesday] = averageWednesdaySales,
    [DayOfWeek.Thursday] = averageThursdaySales,
    [DayOfWeek.Friday] = averageFridaySales,
    [DayOfWeek.Saturday] = averageSaturdaySales,
    [DayOfWeek.Sunday] = averageSundaySales
};
var weekdayAdjustedDemand7Days = 0m;

// Measure historical coverage by distinct sales days,
// not by number of sale-item records.
var historicalSalesDays = productSales
    .Select(s => s.SaleDate.Date)
    .Distinct()
    .Count();

// Forecast confidence is based on how many
// different days contain sales history.
decimal forecastConfidence;

if (historicalSalesDays >= 21)
{
    forecastConfidence = 100m;
}
else if (historicalSalesDays >= 14)
{
    forecastConfidence = 90m;
}
else if (historicalSalesDays >= 7)
{
    forecastConfidence = 75m;
}
else if (historicalSalesDays >= 3)
{
    forecastConfidence = 60m;
}
else if (historicalSalesDays > 0)
{
    forecastConfidence = 40m;
}
else
{
    forecastConfidence = 0m;
}

var forecastMethod =
    historicalSalesDays >= 14
        ? "RecentTrend + Weekday Pattern"
        : "RecentTrend + Limited Weekday Data";

if (historicalSalesDays >= 21)
{
    forecastConfidence = 100m;
}
else if (historicalSalesDays >= 14)
{
    forecastConfidence = 90m;
}
else if (historicalSalesDays >= 7)
{
    forecastConfidence = 75m;
}
else if (historicalSalesDays >= 3)
{
    forecastConfidence = 60m;
}
else if (historicalSalesDays > 0)
{
    forecastConfidence = 40m;
}
else
{
    forecastConfidence = 0m;
}


var forecastDate = now.Date;

for (var i = 0; i < 7; i++)
{
    var day = forecastDate.AddDays(i).DayOfWeek;

    var weekdayAverage =
        weekdayAveragesForForecast[day];

    // Only use weekday-specific demand when
    // we actually have enough historical evidence.
    var daysWithSalesForWeekday = productSales
        .Where(s =>
            s.SaleDate.DayOfWeek == day)
        .Select(s => s.SaleDate.Date)
        .Distinct()
        .Count();

    if (daysWithSalesForWeekday >= 2)
    {
        // Blend the weekday pattern with the
        // overall intelligent daily forecast.
        var adjustedDailyDemand =
            (weightedDailySales * 0.60m) +
            (weekdayAverage * 0.40m);

        weekdayAdjustedDemand7Days +=
            adjustedDailyDemand;
    }
    else
    {
        // Not enough history for this weekday.
        // Fall back to the general forecast.
        weekdayAdjustedDemand7Days +=
            weightedDailySales;
    }
}

var predictedDemand7Days =
    weekdayAdjustedDemand7Days;


            decimal daysUntilStockout;

            if (weightedDailySales <= 0)
            {
                daysUntilStockout = decimal.MaxValue;
            }
            else
            {
                daysUntilStockout =
                    product.QuantityInStock /
                    weightedDailySales;
            }

            /*
             * Expected demand while waiting for the supplier.
             */
            // Intelligent target-stock calculation.
//
// We want enough stock to cover:
// 1. Supplier lead time
// 2. The configured target stock coverage period
// 3. The product's safety/reorder level


// Calculate how many days of stock we want available.
var coverageDays =
    product.SupplierLeadTimeDays +
    product.TargetStockDays;

// Convert the 7-day forecast into an estimated
// daily demand rate.
var forecastDailyDemand =
    predictedDemand7Days / 7m;

// Reduce the forecast when historical confidence
// is limited.
var confidenceAdjustedDailyDemand =
    forecastDailyDemand *
    (forecastConfidence / 100m);

// Demand expected during the desired coverage period.
var targetDemand =
    confidenceAdjustedDailyDemand *
    coverageDays;

// Reorder level acts as safety stock.
var safetyStock =
    product.ReorderLevel;

// Total stock we ideally want available.
var targetStockLevel =
    (int)Math.Ceiling(
        targetDemand + safetyStock
    );

// Amount that needs to be ordered.
var recommendedOrderQuantity =
    Math.Max(
        0,
        targetStockLevel - product.QuantityInStock
    );

// Respect the product's configured minimum
// reorder quantity.
if (recommendedOrderQuantity > 0 &&
    product.ReorderQuantity > 0)
{
    recommendedOrderQuantity =
        Math.Max(
            recommendedOrderQuantity,
            product.ReorderQuantity
        );
}

string recommendationReason;

if (product.QuantityInStock <= 0)
{
    recommendationReason =
        "Product is out of stock.";
}
else if (forecastConfidence < 75)
{
    recommendationReason =
        "Limited sales history; recommendation is based on cautious demand forecasting.";
}
else if (salesGrowthPercentage >= 20)
{
    recommendationReason =
        "Demand is rising; additional stock is recommended to maintain coverage.";
}
else if (salesGrowthPercentage <= -20)
{
    recommendationReason =
        "Demand is falling; recommendation has been reduced to avoid overstocking.";
}
else
{
    recommendationReason =
        "Recommendation is based on recent demand, supplier lead time and target stock coverage.";
}

           string status;

if (product.QuantityInStock <= 0)
{
    status = "OutOfStock";
}
else if (weightedDailySales > 0 &&
         daysUntilStockout <=
         Math.Max(1, product.SupplierLeadTimeDays))
{
    status = "Critical";
}
else if (product.QuantityInStock <=
         product.ReorderLevel)
{
    status = "ReorderSoon";
}
else if (weightedDailySales > 0 &&
         daysUntilStockout <= 7)
{
    status = "Watch";
}
else
{
    status = "Healthy";
}

            predictions.Add(new InventoryPredictionDto
            {
                ProductId = product.ProductId,
                ProductName = product.ProductName,
                ProductCode = product.ProductCode,

                CurrentStock =
                    product.QuantityInStock,

                ReorderLevel =
                    product.ReorderLevel,

                ReorderQuantity =
                    product.ReorderQuantity,

                SupplierLeadTimeDays =
                    product.SupplierLeadTimeDays,

                    TargetStockDays = product.TargetStockDays,

                    ForecastConfidence = Math.Round(forecastConfidence, 2),

TargetStockLevel = targetStockLevel,

RecommendationReason = recommendationReason,

                UnitsSoldLast7Days =
                    unitsSold7Days,

                UnitsSoldLast30Days =
                    unitsSold30Days,

                AverageDailySales7Days =
                    Math.Round(
                        averageDaily7Days,
                        2),

                AverageDailySales30Days =
                    Math.Round(
                        averageDaily30Days,
                        2),

                WeightedDailySales =
                    Math.Round(
                        weightedDailySales,
                        2),

                PredictedDemand7Days =
                    Math.Round(
                        predictedDemand7Days,
                        2),

                DaysUntilStockout =
                    daysUntilStockout ==
                    decimal.MaxValue
                        ? 0
                        : Math.Round(
                            daysUntilStockout,
                            1),

                RecommendedOrderQuantity =
                    recommendedOrderQuantity,

                UnitsSoldPrevious7Days =
    unitsSoldPrevious7Days,

SalesGrowthPercentage =
    Math.Round(
        salesGrowthPercentage,
        2),

DemandTrend =
    demandTrend,

    Status =

    status,

    AverageMondaySales =
    Math.Round(averageMondaySales, 2),

AverageTuesdaySales =
    Math.Round(averageTuesdaySales, 2),

AverageWednesdaySales =
    Math.Round(averageWednesdaySales, 2),

AverageThursdaySales =
    Math.Round(averageThursdaySales, 2),

AverageFridaySales =
    Math.Round(averageFridaySales, 2),

AverageSaturdaySales =
    Math.Round(averageSaturdaySales, 2),

AverageSundaySales =
    Math.Round(averageSundaySales, 2),

PeakSalesDay =
    peakSalesDay,

PeakSalesDayAverage =
    Math.Round(peakSalesDayAverage, 2),

SlowestSalesDay =
    slowestSalesDay,

SlowestSalesDayAverage =
    Math.Round(slowestSalesDayAverage, 2),
    WeekdayAdjustedDemand7Days =
    Math.Round(
        weekdayAdjustedDemand7Days,
        2),

ForecastMethod =
    forecastMethod,

DataQuality =
    dataQuality,
            });
        }

        return predictions
            .OrderBy(p =>
                p.Status == "OutOfStock" ? 0 :
                p.Status == "Critical" ? 1 :
                p.Status == "ReorderSoon" ? 2 :
                p.Status == "Watch" ? 3 : 4)
            .ThenBy(p => p.DaysUntilStockout)
            .ToList();
    }

    public async Task<InventoryPredictionDto?> GetPredictionAsync(
        int productId)
    {
        var predictions =
            await GetPredictionsAsync();

        return predictions.FirstOrDefault(
            p => p.ProductId == productId);
    }
}