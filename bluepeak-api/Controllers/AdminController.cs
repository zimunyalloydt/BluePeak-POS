using bluepeak_api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using bluepeak_api.DTOs.Admin;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;

    public AdminController(IAdminService service)
    {
        _service = service;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        return Ok(await _service.GetDashboardAsync());
    }

    [HttpGet("sales")]
public async Task<IActionResult> GetSales()
{
    return Ok(await _service.GetSalesAsync());
}

[HttpGet("users")]
public async Task<IActionResult> GetUsers()
{
    return Ok(await _service.GetUsersAsync());
}

[HttpPost("users")]
public async Task<IActionResult> CreateUser(CreateUserDto dto)
{
    await _service.CreateUserAsync(dto);

    return Ok();
}

[HttpGet("users/{id}/permissions")]
public async Task<IActionResult> GetPermissions(int id)
{
    return Ok(await _service.GetUserPermissionsAsync(id));
}

[HttpPut("users/{id}/permissions")]
public async Task<IActionResult> UpdatePermissions(
    int id,
    UpdateUserPermissionsDto dto)
{
    await _service.UpdateUserPermissionsAsync(
        id,
        dto.PermissionIds);

    return Ok();
}
}