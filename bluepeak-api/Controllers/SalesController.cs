using bluepeak_api.DTOs.Sales;
using bluepeak_api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _service;

    public SalesController(ISaleService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateSaleDto dto)
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
            return Unauthorized();

        int userId = int.Parse(claim.Value);

        try
        {
            int saleId = await _service.ProcessSaleAsync(dto, userId);

            return Ok(new
            {
                SaleId = saleId,
                Message = "Sale completed successfully."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                Message = ex.Message
            });
        }
    }

    [HttpGet("my-sales")]
    public async Task<IActionResult> GetMySales()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
            return Unauthorized();

        int userId = int.Parse(claim.Value);

        var sales = await _service.GetMySalesAsync(userId);

        return Ok(sales);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetReceipt(int id)
    {
        var receipt = await _service.GetReceiptAsync(id);

        if (receipt == null)
            return NotFound();

        return Ok(receipt);
    }
}