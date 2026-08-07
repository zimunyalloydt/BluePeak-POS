import api from "./api";




export async function getMyTasks() {
    const { data } = await api.get("/tasks/my");
    return data;
}

export async function createTask(task) {
    const { data } = await api.post("/tasks", task);
    return data;
}

export async function completeTask(taskId) {
    const { data } = await api.put(`/tasks/${taskId}/complete`);
    return data;
}

export async function getAllTasks() {
    const { data } = await api.get("/tasks");
    return data;
}
export async function updateTask(taskId, task) {
    const { data } = await api.put(`/tasks/${taskId}`, task);
    return data;
}

export async function deleteTask(taskId) {
    const { data } = await api.delete(`/tasks/${taskId}`);
    return data;
}