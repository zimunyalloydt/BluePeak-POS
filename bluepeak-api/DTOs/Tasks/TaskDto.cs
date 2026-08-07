namespace bluepeak_api.DTOs.Tasks;

public class TaskDto
{
    public int TaskItemId { get; set; }

    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public string Priority { get; set; } = "";

    public string Status { get; set; } = "";

    public DateTime CreatedAt { get; set; }

    public DateTime? DueDate { get; set; }

    public List<string> AssignedUsers { get; set; } = [];

    // NEW
    public int TotalAssigned { get; set; }

    public int CompletedAssignments { get; set; }

    public int RemainingAssignments { get; set; }
}