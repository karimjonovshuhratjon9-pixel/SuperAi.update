import React, { useState, useEffect } from "react";
import { Workflow, WorkflowNode } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  Badge,
  EmptyState,
  LoadingSkeleton,
} from "./ui/SharedUI";

interface WorkflowsViewProps {
  userId: string;
}

const NODE_TYPES = [
  { type: "trigger", label: "⚡ Trigger", color: "text-amber-300" },
  { type: "ai", label: "🤖 AI", color: "text-blue-300" },
  { type: "search", label: "🔍 Search", color: "text-cyan-300" },
  { type: "file", label: "📁 File", color: "text-emerald-300" },
  { type: "email", label: "✉️ Email", color: "text-purple-300" },
  { type: "http", label: "🌐 HTTP", color: "text-pink-300" },
  { type: "condition", label: "🔀 Condition", color: "text-yellow-300" },
  { type: "code", label: "💻 Code", color: "text-indigo-300" },
  { type: "delay", label: "⏱️ Delay", color: "text-slate-300" },
  { type: "notification", label: "🔔 Notification", color: "text-red-300" },
];

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({ userId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [creating, setCreating] = useState(false);

  const loadWorkflows = async () => {
    setLoading(true);
    const items = await dbService.getWorkflowsByUserId(userId);
    setWorkflows(items);
    setLoading(false);
  };

  useEffect(() => {
    loadWorkflows();
  }, [userId]);

  const addNode = (type: WorkflowNode["type"]) => {
    const node: WorkflowNode = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type,
      name: NODE_TYPES.find((n) => n.type === type)?.label || type,
      config: {},
    };
    setNodes((prev) => [...prev, node]);
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const workflow: Workflow = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      name: name.trim(),
      description: description.trim() || undefined,
      nodes,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveWorkflow(workflow);
    setName("");
    setDescription("");
    setNodes([]);
    setCreating(false);
    loadWorkflows();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bu workflow'ni o'chirishni tasdiqlaysizmi?")) {
      await dbService.deleteWorkflow(id);
      loadWorkflows();
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Workflows"
          title="🔄 Workflow Builder"
          description="Vizual workflow tizimi — trigger, AI, condition va actionlarni ulang"
          actions={
            <Button onClick={() => setCreating(!creating)}>
              {creating ? "✕ Yopish" : "+ Yangi Workflow"}
            </Button>
          }
        />

        {creating && (
          <Card>
            <div className="space-y-4">
              <Input
                value={name}
                onChange={setName}
                placeholder="Workflow nomi"
              />
              <Input
                value={description}
                onChange={setDescription}
                placeholder="Tavsif (ixtiyoriy)"
              />

              <div>
                <h4 className="text-xs font-black text-slate-400 mb-2">
                  Node qo'shish
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {NODE_TYPES.map((node) => (
                    <button
                      key={node.type}
                      onClick={() => addNode(node.type as WorkflowNode["type"])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/60 hover:bg-slate-700 transition ${node.color}`}
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>

              {nodes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-400">
                    Workflow zanjiri
                  </h4>
                  {nodes.map((node, idx) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-white/10"
                    >
                      <span className="text-xs font-black text-slate-500">
                        {idx + 1}.
                      </span>
                      <span
                        className={`text-xs font-bold ${NODE_TYPES.find((n) => n.type === node.type)?.color}`}
                      >
                        {NODE_TYPES.find((n) => n.type === node.type)?.label}
                      </span>
                      <span className="flex-1 text-xs text-slate-400">
                        {node.name}
                      </span>
                      <button
                        onClick={() => removeNode(node.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full"
              >
                💾 Workflow'ni saqlash
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : workflows.length === 0 && !creating ? (
          <EmptyState
            icon="🔄"
            title="Workflow'lar yo'q"
            description="Yangi workflow yarating — trigger, AI, condition va actionlarni ulang."
            action={
              <Button onClick={() => setCreating(true)}>
                + Yangi Workflow
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {workflow.name}
                      </h4>
                      <Badge color={workflow.isActive ? "green" : "slate"}>
                        {workflow.isActive ? "Faol" : "O'chirilgan"}
                      </Badge>
                    </div>
                    {workflow.description && (
                      <p className="text-xs text-slate-400 mt-1">
                        {workflow.description}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {workflow.nodes.map((node) => (
                        <span
                          key={node.id}
                          className={`text-[10px] font-bold ${NODE_TYPES.find((n) => n.type === node.type)?.color}`}
                        >
                          {NODE_TYPES.find((n) => n.type === node.type)?.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition"
                  >
                    🗑
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
