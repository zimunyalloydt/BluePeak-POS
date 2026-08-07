using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("chat-users")]
    public async Task<IActionResult> GetChatUsers()
    {
        var users = await _userService.GetChatUsersAsync(CurrentUserId);
        return Ok(users);
    }
}