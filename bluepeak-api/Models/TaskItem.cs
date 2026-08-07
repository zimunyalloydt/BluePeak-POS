namespace bluepeak_api.Models;

public class TaskItem
{
    public int TaskItemId { get; set; }

    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public string Priority { get; set; } = "High";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? DueDate { get; set; }

    public string Status { get; set; } = "Pending";

    public int CreatedByUserId { get; set; }

    public User? CreatedByUser { get; set; }

    public ICollection<TaskAssignment> Assignments { get; set; }
        = new List<TaskAssignment>();
}