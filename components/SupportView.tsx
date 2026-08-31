import React, { useState, useEffect } from "react";
import { SupportTicket, SupportReply } from "../types";
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

interface SupportViewProps {
  userId: string;
}

export const SupportView: React.FC<SupportViewProps> = ({ userId }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [reply, setReply] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    const items = await dbService.getSupportTicketsByUserId(userId);
    setTickets(items);
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [userId]);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    const ticket: SupportTicket = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      replies: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.saveSupportTicket(ticket);
    setSubject("");
    setMessage("");
    setCreating(false);
    loadTickets();
  };

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    const newReply: SupportReply = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      userId,
      message: reply.trim(),
      isAdmin: false,
      timestamp: Date.now(),
    };
    selectedTicket.replies.push(newReply);
    selectedTicket.updatedAt = Date.now();
    await dbService.saveSupportTicket(selectedTicket);
    setReply("");
    loadTickets();
  };

  const handleClose = async (ticket: SupportTicket) => {
    ticket.status = "closed";
    await dbService.saveSupportTicket(ticket);
    if (selectedTicket?.id === ticket.id) setSelectedTicket(null);
    loadTickets();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open":
        return "green";
      case "in_progress":
        return "yellow";
      case "closed":
        return "slate";
      default:
        return "slate";
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Support"
          title="🎧 Qo'llab-quvvatlash"
          description="Muammolaringiz bo'yicha ticket yarating"
          actions={
            <Button onClick={() => setCreating(!creating)}>
              {creating ? "✕ Yopish" : "+ Yangi Ticket"}
            </Button>
          }
        />

        {creating && (
          <Card>
            <div className="space-y-4">
              <Input
                value={subject}
                onChange={setSubject}
                placeholder="Mavzu"
              />
              <TextArea
                value={message}
                onChange={setMessage}
                placeholder="Muammoingizni tasvirlang..."
                rows={4}
              />
              <Button
                onClick={handleCreate}
                disabled={!subject.trim() || !message.trim()}
                className="w-full"
              >
                📨 Ticket yaratish
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : tickets.length === 0 && !creating ? (
          <EmptyState
            icon="🎧"
            title="Ticketlar yo'q"
            description="Muammo yoki savolingiz bo'lsa, yangi ticket yarating."
            action={
              <Button onClick={() => setCreating(true)}>+ Yangi Ticket</Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="hover:border-blue-500/30 transition cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">
                        {ticket.subject}
                      </h4>
                      <Badge color={statusColor(ticket.status) as any}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(ticket.createdAt).toLocaleString()} •{" "}
                      {ticket.replies.length} javob
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose(ticket);
                    }}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    Yopish
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedTicket && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white">
                {selectedTicket.subject}
              </h3>
              <Badge color={statusColor(selectedTicket.status) as any}>
                {selectedTicket.status}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/60">
                <p className="text-xs text-slate-400">
                  {selectedTicket.message}
                </p>
              </div>
              {selectedTicket.replies.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl ${r.isAdmin ? "bg-blue-600/10 border border-blue-500/30" : "bg-slate-800/60"}`}
                >
                  <p className="text-[10px] text-slate-500 mb-1">
                    {r.isAdmin ? "🛡️ Admin" : "👤 Siz"} •{" "}
                    {new Date(r.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-300">{r.message}</p>
                </div>
              ))}
              {selectedTicket.status !== "closed" && (
                <div className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={setReply}
                    placeholder="Javob yozing..."
                  />
                  <Button onClick={handleReply} disabled={!reply.trim()}>
                    Yuborish
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
