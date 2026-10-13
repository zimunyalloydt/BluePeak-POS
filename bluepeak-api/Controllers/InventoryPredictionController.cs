using bluepeak_api.DTOs.Inventory;
using bluepeak_api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InventoryPredictionController : ControllerBase
{
    private readonly IInventoryPredictionService
        _inventoryPredictionService;

    public InventoryPredictionController(
        IInventoryPredictionService inventoryPredictionService)
    {
        _inventoryPredictionService =
            inventoryPredictionService;
    }

    [HttpGet]
    public async Task<ActionResult<
        List<InventoryPredictionDto>>> GetPredictions()
    {
        var predictions =
            await _inventoryPredictionService
                .GetPredictionsAsync();

        return Ok(predictions);
    }

    [HttpGet("{productId}")]
    public async Task<ActionResult<
        InventoryPredictionDto>> GetPrediction(
            int productId)
    {
        var prediction =
            await _inventoryPredictionService
                .GetPredictionAsync(productId);

        if (prediction == null)
        {
            return NotFound(new
            {
                message = "Product not found."
            });
        }

        return Ok(prediction);
    }
}