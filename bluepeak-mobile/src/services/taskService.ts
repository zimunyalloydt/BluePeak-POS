import api from "./api";

export type Task = {

    taskItemId: number;

    title: string;

    description: string;

    priority: string;

    status: string;

    createdAt: string;

    dueDate: string | null;

    assignedUsers: string[];

    totalAssigned: number;

    completedAssignments: number;

    remainingAssignments: number;

};

export async function getMyTasks(): Promise<Task[]> {

    const { data } = await api.get("/Tasks/my");

    return Array.isArray(data) ? data : [];

}

export async function completeTask(

    taskId: number

): Promise<void> {

    await api.put(`/Tasks/${taskId}/complete`);

}