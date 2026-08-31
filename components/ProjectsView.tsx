import React, { useState, useEffect } from "react";
import { Project } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  TextArea,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface ProjectsViewProps {
  userId: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ userId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    const items = await dbService.getProjectsByUserId(userId);
    setProjects(items);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project: Project = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      name: name.trim(),
      description: description.trim() || undefined,
      files: [],
      chats: [],
      agents: [],
      tasks: [],
      activity: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveProject(project);
    setName("");
    setDescription("");
    setCreating(false);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu loyihani o'chirishni tasdiqlaysizmi?")) {
      await dbService.deleteProject(id);
      loadProjects();
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Projects"
          title="📁 Loyihalar"
          description="Loyihalaringizni yarating va boshqaring"
          actions={
            <Button onClick={() => setCreating(!creating)}>
              {creating ? "✕ Yopish" : "+ Yangi Loyiha"}
            </Button>
          }
        />

        {creating && (
          <Card>
            <div className="space-y-4">
              <Input
                value={name}
                onChange={setName}
                placeholder="Loyiha nomi"
              />
              <TextArea
                value={description}
                onChange={setDescription}
                placeholder="Loyiha tavsifi"
                rows={3}
              />
              <Button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full"
              >
                💾 Loyihani yaratish
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : projects.length === 0 && !creating ? (
          <EmptyState
            icon="📁"
            title="Loyihalar yo'q"
            description="Yangi loyiha yarating — fayllar, chatlar, agentlar va vazifalarni bir joyda boshqaring."
            action={
              <Button onClick={() => setCreating(true)}>+ Yangi Loyiha</Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">📁</div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                  >
                    🗑
                  </button>
                </div>
                <h4 className="mt-3 text-sm font-black text-white">
                  {project.name}
                </h4>
                {project.description && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge color="blue">{project.files.length} fayl</Badge>
                  <Badge color="green">{project.chats.length} chat</Badge>
                  <Badge color="purple">{project.agents.length} agent</Badge>
                  <Badge color="yellow">{project.tasks.length} vazifa</Badge>
                </div>
                <p className="mt-3 text-[10px] text-slate-500">
                  Yangilangan:{" "}
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
