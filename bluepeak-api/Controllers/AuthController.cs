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

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(
                "Invalid username, password or organisation code.");
        }

        return Ok(result);
    }

    [HttpPost("register-organisation")]
    public async Task<IActionResult> RegisterOrganisation(
        [FromBody] RegisterOrganisationDto request)
    {
        var result =
            await _authService.RegisterOrganisationAsync(request);

        if (!result.Success)
        {
            return Conflict(result);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            result);
    }
}