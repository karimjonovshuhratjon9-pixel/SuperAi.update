import React, { useState, useEffect } from "react";
import { Task } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  LoadingSkeleton,
  ProgressBar,
} from "./ui/SharedUI";

interface TaskCenterViewProps {
  userId: string;
}

export const TaskCenterView: React.FC<TaskCenterViewProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "failed" | "scheduled"
  >("all");

  const loadTasks = async () => {
    setLoading(true);
    const items = await dbService.getTasksByUserId(userId);
    setTasks(items);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "blue";
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "scheduled":
        return "yellow";
      default:
        return "slate";
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Task Center"
          title="📋 Vazifalar Markazi"
          description="Barcha AI vazifalaringizni kuzating"
        />

        <div className="flex gap-2 flex-wrap">
          {["all", "active", "completed", "failed", "scheduled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "Hammasi" : f}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Vazifalar yo'q"
            description="AI vazifalari bu yerda ko'rinadi — video render, tadqiqot, fayl tahlili va boshqalar."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <Card
                key={task.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge color={statusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                    <span className="text-sm font-black text-white">
                      {task.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(task.startedAt).toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  progress={task.progress}
                  statusText={task.statusText}
                />
                {task.error && (
                  <p className="mt-2 text-xs text-red-300">⚠️ {task.error}</p>
                )}
                {task.finishedAt && (
                  <p className="mt-2 text-[10px] text-slate-500">
                    Yakunlandi: {new Date(task.finishedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
