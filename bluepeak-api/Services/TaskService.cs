using bluepeak_api.Data;
using bluepeak_api.DTOs.Tasks;
using bluepeak_api.Hubs;
using bluepeak_api.Interfaces;
using bluepeak_api.Models;
using bluepeak_api.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace bluepeak_api.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly IOrganisationContext _organisationContext;

    public TaskService(
        AppDbContext context,
        IHubContext<NotificationHub> hub,
        IOrganisationContext organisationContext)
    {
        _context = context;
        _hub = hub;
        _organisationContext = organisationContext;
    }

    private int OrganisationId => _organisationContext.OrganisationId;

    private async Task<User> GetActiveOrganisationUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.UserId == userId &&
                u.OrganisationId == OrganisationId &&
                u.IsActive);

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "The user is not active or does not belong to this organisation.");
        }

        return user;
    }

    public async Task<TaskDto> CreateTaskAsync(
        CreateTaskDto dto,
        int createdByUserId)
    {
        await GetActiveOrganisationUserAsync(createdByUserId);

        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            throw new ArgumentException("A task title is required.");
        }

        List<int> assignedUsers;

        if (dto.AssignToAll)
        {
            assignedUsers = await _context.Users
                .Where(u =>
                    u.OrganisationId == OrganisationId &&
                    u.IsActive)
                .Select(u => u.UserId)
                .ToListAsync();
        }
        else
        {
            assignedUsers = (dto.UserIds ?? new List<int>())
                .Distinct()
                .ToList();
        }

        if (assignedUsers.Count == 0)
        {
            throw new ArgumentException(
                "At least one user must be assigned to the task.");
        }

        // Validate every assignee before saving the task.
        var validAssigneeIds = await _context.Users
            .Where(u =>
                assignedUsers.Contains(u.UserId) &&
                u.OrganisationId == OrganisationId &&
                u.IsActive)
            .Select(u => u.UserId)
            .ToListAsync();

        if (validAssigneeIds.Count != assignedUsers.Count)
        {
            throw new ArgumentException(
                "One or more assigned users are inactive or do not belong to your organisation.");
        }

        var task = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description ?? string.Empty,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            CreatedByUserId = createdByUserId,
            Status = "Pending"
        };

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

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
        await transaction.CommitAsync();

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

        var assignedUserNames = await _context.Users
            .Where(u =>
                assignedUsers.Contains(u.UserId) &&
                u.OrganisationId == OrganisationId)
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
            .Where(t =>
                t.CreatedByUser != null &&
                t.CreatedByUser.OrganisationId == OrganisationId)
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
                    .Where(a =>
                        a.User != null &&
                        a.User.OrganisationId == OrganisationId)
                    .Select(a =>
                        a.User!.FirstName + " " + a.User.LastName)
                    .ToList(),

                TotalAssigned = t.Assignments.Count(a =>
                    a.User != null &&
                    a.User.OrganisationId == OrganisationId),

                CompletedAssignments = t.Assignments.Count(a =>
                    a.User != null &&
                    a.User.OrganisationId == OrganisationId &&
                    a.IsCompleted),

                RemainingAssignments = t.Assignments.Count(a =>
                    a.User != null &&
                    a.User.OrganisationId == OrganisationId &&
                    !a.IsCompleted)
            })
            .ToListAsync();
    }

    public async Task<List<TaskDto>> GetMyTasksAsync(int userId)
    {
        await GetActiveOrganisationUserAsync(userId);

        return await _context.TaskAssignments
            .Where(a =>
                a.UserId == userId &&
                a.User != null &&
                a.User.OrganisationId == OrganisationId &&
                a.TaskItem != null &&
                a.TaskItem.CreatedByUser != null &&
                a.TaskItem.CreatedByUser.OrganisationId == OrganisationId)
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
        await GetActiveOrganisationUserAsync(userId);

        var assignment = await _context.TaskAssignments
            .Include(a => a.TaskItem)
                .ThenInclude(t => t!.CreatedByUser)
            .FirstOrDefaultAsync(a =>
                a.TaskItemId == taskId &&
                a.UserId == userId &&
                a.User != null &&
                a.User.OrganisationId == OrganisationId &&
                a.TaskItem != null &&
                a.TaskItem.CreatedByUser != null &&
                a.TaskItem.CreatedByUser.OrganisationId == OrganisationId);

        if (assignment == null)
        {
            throw new KeyNotFoundException(
                "Task not found or not assigned to you in your organisation.");
        }

        if (assignment.IsCompleted)
        {
            throw new InvalidOperationException("Task already completed.");
        }

        assignment.IsCompleted = true;
        assignment.CompletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var organisationAssignments = _context.TaskAssignments
            .Where(a =>
                a.TaskItemId == taskId &&
                a.User != null &&
                a.User.OrganisationId == OrganisationId);

        var allCompleted = await organisationAssignments
            .AllAsync(a => a.IsCompleted);

        if (allCompleted)
        {
            var task = assignment.TaskItem!;

            task.Status = "Completed";
            await _context.SaveChangesAsync();

            var assignees = await organisationAssignments
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
                        Type = "TaskAssigned",
                        TaskId = taskId
                    });
            }
        }
        else
        {
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

    public async Task DeleteTaskAsync(int taskId)
    {
        var task = await _context.TaskItems
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t =>
                t.TaskItemId == taskId &&
                t.CreatedByUser != null &&
                t.CreatedByUser.OrganisationId == OrganisationId);

        if (task == null)
        {
            throw new KeyNotFoundException(
                "Task not found in your organisation.");
        }

        _context.TaskAssignments.RemoveRange(task.Assignments);
        _context.TaskItems.Remove(task);

        await _context.SaveChangesAsync();
    }

    public async Task UpdateTaskStatusAsync(int taskId, string status)
    {
        var task = await _context.TaskItems
            .FirstOrDefaultAsync(t =>
                t.TaskItemId == taskId &&
                t.CreatedByUser != null &&
                t.CreatedByUser.OrganisationId == OrganisationId);

        if (task == null)
        {
            throw new KeyNotFoundException(
                "Task not found in your organisation.");
        }

        task.Status = status;
        await _context.SaveChangesAsync();
    }
}
