using System.Security.Claims;
using bluepeak_api.DTOs.Tasks;
using bluepeak_api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace bluepeak_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpPost]
public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var task = await _taskService.CreateTaskAsync(dto, userId);

    return Ok(task);
}

 

    [HttpGet("my")]
    public async Task<IActionResult> GetMyTasks()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var tasks = await _taskService.GetMyTasksAsync(userId);

        return Ok(tasks);
    }

    

    [HttpPut("{taskId}/complete")]
    public async Task<IActionResult> CompleteTask(int taskId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        await _taskService.CompleteTaskAsync(taskId, userId);

        return Ok(new { message = "Task completed successfully." });
    }

    [HttpGet]
public async Task<IActionResult> GetAllTasks()
{
    var tasks = await _taskService.GetAllTasksAsync();

    return Ok(tasks);
}
}