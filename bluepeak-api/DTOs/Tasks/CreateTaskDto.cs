namespace bluepeak_api.DTOs.Tasks;

public class CreateTaskDto
{
    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public string Priority { get; set; } = "Normal";

    public DateTime? DueDate { get; set; }

    public bool AssignToAll { get; set; } = false;

    public List<int> UserIds { get; set; } = new();
}