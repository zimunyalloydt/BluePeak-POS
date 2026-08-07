import TaskCard from "./TaskCard";

const tasks = [
    {
        id: 1,
        title: "Count Drinks",
        priority: "High",
        status: "Pending",
        assignedBy: "Administrator"
    },
    {
        id: 2,
        title: "Clean Till 2",
        priority: "High",
        status: "Pending",
        assignedBy: "Administrator"
    }
];

export default function TaskList() {
    return (
        <div className="space-y-4">

            {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
            ))}

        </div>
    );
}