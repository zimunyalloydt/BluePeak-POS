using System.Security.Claims;
using bluepeak_api.DTOs.Refunds;
using bluepeak_api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RefundsController : ControllerBase
{
    private readonly IRefundService _refundService;

    public RefundsController(
        IRefundService refundService)
    {
        _refundService = refundService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateRefundRequestDto dto)
    {
        var claim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
            return Unauthorized();

        var userId = int.Parse(claim.Value);

        try
        {
            await _refundService.CreateRequestAsync(
                userId,
                dto);

            return Ok(new
            {
                Message =
                    "Refund request submitted successfully."
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
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

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPending()
    {
        var requests =
            await _refundService.GetPendingAsync();

        return Ok(requests);
    }

    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Approve(int id)
    {
        var claim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
            return Unauthorized();

        var adminUserId = int.Parse(claim.Value);

        try
        {
            await _refundService.ApproveAsync(
                id,
                adminUserId);

            return Ok(new
            {
                Message =
                    "Refund approved successfully."
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

    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reject(int id)
    {
        var claim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (claim == null)
            return Unauthorized();

        var adminUserId = int.Parse(claim.Value);

        try
        {
            await _refundService.RejectAsync(
                id,
                adminUserId);

            return Ok(new
            {
                Message =
                    "Refund rejected successfully."
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
}
