import React, { useState } from "react";
import { User } from "../types";
import { dbService } from "../services/dbService";
import {
  PageHeader,
  Button,
  Card,
  Input,
  TextArea,
  Select,
  Badge,
} from "./ui/SharedUI";

interface ProfileViewProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUserUpdate,
}) => {
  const [name, setName] = useState(user.name || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [bio, setBio] = useState(user.bio || "");
  const [language, setLanguage] = useState(user.language || "uz");
  const [theme, setTheme] = useState<string>(user.theme || "dark");
  const [accentColor, setAccentColor] = useState(user.accentColor || "#3b82f6");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const updated: User = {
      ...user,
      name: name.trim() || user.name,
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      language,
      theme: theme as User["theme"],
      accentColor,
    };
    await dbService.saveUser(updated);
    onUserUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-5 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Profile"
          title="👤 Profil"
          description="Shaxsiy ma'lumotlaringizni boshqaring"
        />

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
              {(displayName || name)?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {displayName || name}
              </h3>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge color="blue">{user.plan || "FREE"}</Badge>
                <Badge color="purple">Level {user.level || 1}</Badge>
                <Badge color="yellow">🔥 {user.streak || 0} kun</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Ism
                </label>
                <Input value={name} onChange={setName} placeholder="Ismingiz" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Display name
                </label>
                <Input
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Ko'rinadigan ism"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Bio
              </label>
              <TextArea
                value={bio}
                onChange={setBio}
                placeholder="O'zingiz haqingizda qisqacha"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Til
                </label>
                <Select
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: "uz", label: "O'zbek" },
                    { value: "ru", label: "Русский" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Mavzu
                </label>
                <Select
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "dark", label: "🌙 Dark" },
                    { value: "light", label: "☀️ Light" },
                    { value: "system", label: "💻 System" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Aksent rangi
                </label>
                <div className="flex gap-2 items-center">
                  {[
                    "#3b82f6",
                    "#8b5cf6",
                    "#10b981",
                    "#f59e0b",
                    "#ef4444",
                    "#ec4899",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`w-8 h-8 rounded-lg transition ${accentColor === color ? "ring-2 ring-white scale-110" : ""}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {saved ? "✅ Saqlandi!" : "💾 Profilni saqlash"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
