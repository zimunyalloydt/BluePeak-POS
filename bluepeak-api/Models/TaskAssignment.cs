namespace bluepeak_api.Models;

public class TaskAssignment
{
    public int TaskAssignmentId { get; set; }

    public int TaskItemId { get; set; }

    public TaskItem? TaskItem { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public bool IsRead { get; set; } = false;

    public bool IsCompleted { get; set; } = false;

    public DateTime? ReadAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}