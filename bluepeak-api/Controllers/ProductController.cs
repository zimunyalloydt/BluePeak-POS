using Microsoft.AspNetCore.Mvc;
using bluepeak_api.DTOs.Products;
using bluepeak_api.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace bluepeak_api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IProductService _service;

    public ProductController(IProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var product = await _service.GetByIdAsync(id);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(string q)
    {
        return Ok(await _service.SearchAsync(q));
    }

 [HttpPost]
public async Task<IActionResult> Create([FromForm] CreateProductDto dto)
{
    try
    {
        var result = await _service.CreateAsync(dto);

        if (!result)
        {
            return BadRequest("Product code already exists.");
        }

        return Ok("Product created.");
    }
    catch (UnauthorizedAccessException)
    {
        return Forbid();
    }
}

    [HttpPost("{id:int}/stock/add")]
public async Task<IActionResult> AddStock(
    int id,
    [FromBody] StockAdjustmentDto dto)
{
    try
    {
        var product =
            await _service.AddStockAsync(id, dto);

        if (product == null)
            return NotFound(new
            {
                Message = "Product not found."
            });

        return Ok(product);
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new
        {
            Message = ex.Message
        });
    }
}

[HttpPost("{id:int}/stock/remove")]
public async Task<IActionResult> RemoveStock(
    int id,
    [FromBody] StockAdjustmentDto dto)
{
    try
    {
        var product =
            await _service.RemoveStockAsync(id, dto);

        if (product == null)
            return NotFound(new
            {
                Message = "Product not found."
            });

        return Ok(product);
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new
        {
            Message = ex.Message
        });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new
        {
            Message = ex.Message
        });
    }
}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);

        if (!result)
            return NotFound();

        return Ok("Deleted.");
    }

    [HttpPut("{id:int}")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> Update(
    int id,
    [FromForm] UpdateProductDto dto)
{
    var result = await _service.UpdateAsync(id, dto);

    if (!result)
        return NotFound();

    return Ok("Updated.");
}
}