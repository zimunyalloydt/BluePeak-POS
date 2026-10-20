using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using bluepeak_api.DTOs.Messages;
using bluepeak_api.Services.Interfaces;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private int CurrentUserId =>
        int.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out var userId)
            ? userId
            : throw new UnauthorizedAccessException(
                "Unable to identify the authenticated user.");

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] CreateMessageDto dto)
    {
        var result = await _messageService.SendMessageAsync(
            CurrentUserId,
            dto);

        return Ok(result);
    }

    [HttpGet("conversation/{userId}")]
    public async Task<IActionResult> Conversation(int userId)
    {
        var result = await _messageService.GetConversationAsync(
            CurrentUserId,
            userId);

        return Ok(result);
    }

    [HttpGet("chats")]
    public async Task<IActionResult> Chats()
    {
        var result = await _messageService.GetMyChatsAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpPut("read/{messageId}")]
    public async Task<IActionResult> Read(int messageId)
    {
        await _messageService.MarkAsReadAsync(
            messageId,
            CurrentUserId);

        return Ok(new { message = "Message marked as read." });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _messageService.GetUnreadCountAsync(CurrentUserId);
        return Ok(count);
    }
}
