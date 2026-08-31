import React, { useState, useEffect } from "react";
import { User } from "../types";
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

interface AdminViewProps {
  currentUser: User;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const all = await dbService.getAllUsers();
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSuspend = async (user: User) => {
    const updated = { ...user, isSuspended: !user.isSuspended };
    await dbService.saveUser(updated);
    loadUsers();
  };

  const handlePlanChange = async (
    user: User,
    plan: "FREE" | "PRO" | "VIP" | "ENTERPRISE",
  ) => {
    const updated = { ...user, plan };
    await dbService.saveUser(updated);
    loadUsers();
  };

  if (currentUser.role !== "admin") {
    return (
      <div className="h-full flex items-center justify-center p-10">
        <EmptyState
          icon="🔒"
          title="Ruxsat yo'q"
          description="Admin panelga faqat administratorlar kirishi mumkin."
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Admin Panel"
          title="🛡️ Admin Boshqaruvi"
          description="Foydalanuvchilar, obunalar va tizim holatini boshqaring"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <p className="text-[10px] text-slate-500 font-black uppercase">
              Jami foydalanuvchilar
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {users.length}
            </p>
          </Card>
          <Card>
            <p className="text-[10px] text-slate-500 font-black uppercase">
              Faol
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-300">
              {users.filter((u) => !u.isSuspended).length}
            </p>
          </Card>
          <Card>
            <p className="text-[10px] text-slate-500 font-black uppercase">
              Bloklangan
            </p>
            <p className="mt-2 text-2xl font-black text-red-300">
              {users.filter((u) => u.isSuspended).length}
            </p>
          </Card>
          <Card>
            <p className="text-[10px] text-slate-500 font-black uppercase">
              VIP
            </p>
            <p className="mt-2 text-2xl font-black text-amber-300">
              {users.filter((u) => u.plan === "VIP").length}
            </p>
          </Card>
        </div>

        <Input
          value={search}
          onChange={setSearch}
          placeholder="Foydalanuvchi qidirish..."
        />

        {loading ? (
          <LoadingSkeleton count={5} />
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <Card
                key={user.id}
                className="hover:border-blue-500/30 transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={user.isSuspended ? "red" : "green"}>
                      {user.isSuspended ? "Bloklangan" : "Faol"}
                    </Badge>
                    <select
                      value={user.plan || "FREE"}
                      onChange={(e) =>
                        handlePlanChange(user, e.target.value as any)
                      }
                      className="px-3 py-1.5 bg-slate-800/60 border border-white/10 rounded-xl text-xs text-slate-200 outline-none"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="VIP">VIP</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                    <Button
                      size="sm"
                      variant={user.isSuspended ? "success" : "danger"}
                      onClick={() => handleSuspend(user)}
                    >
                      {user.isSuspended ? "Tiklash" : "Bloklash"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
