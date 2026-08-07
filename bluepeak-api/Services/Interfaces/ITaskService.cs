using bluepeak_api.DTOs.Tasks;

namespace bluepeak_api.Services.Interfaces;

public interface ITaskService
{
    Task<TaskDto> CreateTaskAsync(CreateTaskDto dto, int createdByUserId);

    Task<List<TaskDto>> GetMyTasksAsync(int userId);

    Task<List<TaskDto>> GetAllTasksAsync();

    Task CompleteTaskAsync(int taskId, int userId);

   

}