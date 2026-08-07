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
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> Send(CreateMessageDto dto)
    {
        var result = await _messageService.SendMessageAsync(CurrentUserId, dto);
        return Ok(result);
    }

    [HttpGet("conversation/{userId}")]
    public async Task<IActionResult> Conversation(int userId)
    {
        var result = await _messageService.GetConversationAsync(CurrentUserId, userId);
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
        await _messageService.MarkAsReadAsync(messageId);
        return Ok();
    }

  [HttpGet("unread-count")]
public async Task<IActionResult> GetUnreadCount()
{
    var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    var count = await _messageService.GetUnreadCountAsync(userId);

    return Ok(count);
}
    
}