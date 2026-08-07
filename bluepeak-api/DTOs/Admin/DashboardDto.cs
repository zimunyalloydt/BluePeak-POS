namespace bluepeak_api.DTOs.Admin;

public class DashboardDto
{
    public decimal TodaySales { get; set; }

    public decimal TodayProfit { get; set; }

    public int Transactions { get; set; }

    public decimal AverageSale { get; set; }
}