using bluepeak_api.Data;
using bluepeak_api.DTOs.Tasks;
using bluepeak_api.Hubs;
using bluepeak_api.Models;
using bluepeak_api.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;

    public TaskService(
        AppDbContext context,
        IHubContext<NotificationHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, int createdByUserId)
    {
        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            CreatedByUserId = createdByUserId,
            Status = "Pending"
        };

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        // Determine which users to assign the task to
        List<int> assignedUsers;
        if (dto.AssignToAll)
        {
            assignedUsers = await _context.Users
                .Where(u => u.IsActive)
                .Select(u => u.UserId)
                .ToListAsync();
        }
        else
        {
            assignedUsers = dto.UserIds;
        }

        // Validate that there are users to assign to
        if (assignedUsers == null || assignedUsers.Count == 0)
        {
            throw new ArgumentException("At least one user must be assigned to the task.");
        }

        // Create task assignments and notifications
        foreach (var userId in assignedUsers)
        {
            _context.TaskAssignments.Add(new TaskAssignment
            {
                TaskItemId = task.TaskItemId,
                UserId = userId
            });

            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = "New Task Assigned",
                Message = task.Title,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Type = "Task"
            });
        }

        await _context.SaveChangesAsync();

        // Send real-time notifications via SignalR
        foreach (var userId in assignedUsers)
        {
            await _hub.Clients
    .Group($"User_{userId}")
    .SendAsync("ReceiveNotification", new
    {
        Title = "New Task Assigned",
        Message = task.Description,
        Type = "Task",
        TaskId = task.TaskItemId,
        Priority = task.Priority
    });
        }

        // Get assigned user names for the response
        var assignedUserNames = await _context.Users
            .Where(u => assignedUsers.Contains(u.UserId))
            .Select(u => u.FirstName + " " + u.LastName)
            .ToListAsync();

        return new TaskDto
        {
            TaskItemId = task.TaskItemId,
            Title = task.Title,
            Description = task.Description,
            Priority = task.Priority,
            Status = task.Status,
            CreatedAt = task.CreatedAt,
            DueDate = task.DueDate,
            AssignedUsers = assignedUserNames,
            TotalAssigned = assignedUsers.Count,
            CompletedAssignments = 0,
            RemainingAssignments = assignedUsers.Count
        };
    }

    public async Task<List<TaskDto>> GetAllTasksAsync()
    {
        return await _context.TaskItems
            .Include(t => t.Assignments)
                .ThenInclude(a => a.User)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TaskDto
            {
                TaskItemId = t.TaskItemId,
                Title = t.Title,
                Description = t.Description,
                Priority = t.Priority,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                DueDate = t.DueDate,
                AssignedUsers = t.Assignments
                    .Select(a => a.User!.FirstName + " " + a.User.LastName)
                    .ToList(),
                TotalAssigned = t.Assignments.Count(),
                CompletedAssignments = t.Assignments.Count(a => a.IsCompleted),
                RemainingAssignments = t.Assignments.Count(a => !a.IsCompleted)
            })
            .ToListAsync();
    }

    public async Task<List<TaskDto>> GetMyTasksAsync(int userId)
    {
        return await _context.TaskAssignments
    .Where(a => a.UserId == userId)
    .Include(a => a.TaskItem)
    .OrderByDescending(a => a.TaskItem!.CreatedAt)
    .Select(a => new TaskDto
    {
        TaskItemId = a.TaskItem!.TaskItemId,
        Title = a.TaskItem.Title,
        Description = a.TaskItem.Description,
        Priority = a.TaskItem.Priority,
        Status = a.IsCompleted ? "Completed" : "Pending",
        CreatedAt = a.TaskItem.CreatedAt,
        DueDate = a.TaskItem.DueDate,
        AssignedUsers = new List<string>(),
        TotalAssigned = 1,
        CompletedAssignments = a.IsCompleted ? 1 : 0,
        RemainingAssignments = a.IsCompleted ? 0 : 1
    })
    .ToListAsync();
    }

    public async Task CompleteTaskAsync(int taskId, int userId)
    {
        var assignment = await _context.TaskAssignments
            .FirstOrDefaultAsync(a =>
                a.TaskItemId == taskId &&
                a.UserId == userId);

        if (assignment == null)
            throw new Exception("Task not found or not assigned to you.");

        if (assignment.IsCompleted)
            throw new Exception("Task already completed.");

        assignment.IsCompleted = true;
        assignment.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Check if all assignments for this task are completed
        var allCompleted = await _context.TaskAssignments
            .Where(a => a.TaskItemId == taskId)
            .AllAsync(a => a.IsCompleted);

        if (allCompleted)
        {
            var task = await _context.TaskItems.FindAsync(taskId);

            if (task != null)
            {
                task.Status = "Completed";
                await _context.SaveChangesAsync();

                // Notify all assignees that the task is fully completed
                var assignees = await _context.TaskAssignments
                    .Where(a => a.TaskItemId == taskId)
                    .Select(a => a.UserId)
                    .ToListAsync();

                foreach (var assigneeId in assignees)
                {
                    await _hub.Clients
                        .Group($"User_{assigneeId}")
                        .SendAsync("ReceiveNotification", new
                        {
                            Title = "Task Completed",
                            Message = $"Task '{task.Title}' has been completed by all assignees.",
                            Type = "Task",
                            TaskId = taskId
                        });
                }
            }
        }
        else
        {
            // Notify the user who completed the task (optional)
            await _hub.Clients
                .Group($"User_{userId}")
                .SendAsync("ReceiveNotification", new
                {
                    Title = "Task Progress Updated",
                    Message = "You have completed your part of the task.",
                    Type = "Task",
                    TaskId = taskId
                });
        }
    }

    // Additional helper method to delete a task
    public async Task DeleteTaskAsync(int taskId)
    {
        var task = await _context.TaskItems
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t => t.TaskItemId == taskId);

        if (task == null)
            throw new Exception("Task not found.");

        // Remove all assignments first
        _context.TaskAssignments.RemoveRange(task.Assignments);
        
        // Then remove the task
        _context.TaskItems.Remove(task);
        
        await _context.SaveChangesAsync();
    }

    // Additional helper method to update task status
    public async Task UpdateTaskStatusAsync(int taskId, string status)
    {
        var task = await _context.TaskItems.FindAsync(taskId);
        if (task == null)
            throw new Exception("Task not found.");

        task.Status = status;
        await _context.SaveChangesAsync();
    }
}