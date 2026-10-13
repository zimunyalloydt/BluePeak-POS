using bluepeak_api.DTOs.Inventory;

namespace bluepeak_api.Services.Interfaces;

public interface IInventoryPredictionService
{
    Task<List<InventoryPredictionDto>> GetPredictionsAsync();
    
    Task<InventoryPredictionDto?> GetPredictionAsync(int productId);
}