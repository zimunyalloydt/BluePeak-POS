using Microsoft.AspNetCore.Mvc;
using bluepeak_api.DTOs.Authentication;
using bluepeak_api.Interfaces;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterUserDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (!result)
            return BadRequest("Username already exists.");

        return Ok("User created successfully.");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
            return Unauthorized("Invalid username or password.");

        return Ok(result);
    }
}