import React from "react";
import SuperAIModal from "./SuperAIModal";

export type PersonalityId =
  | "friendly"
  | "professional"
  | "funny"
  | "teacher"
  | "motivator";

export interface PersonalityDef {
  id: PersonalityId;
  icon: string;
  name: string;
  desc: string;
}

export const PERSONALITIES: PersonalityDef[] = [
  {
    id: "friendly",
    icon: "🙂",
    name: "Samimiy Do'st",
    desc: "Iliq, do'stona va har doim dalda beruvchi suhbatdosh",
  },
  {
    id: "professional",
    icon: "💼",
    name: "Professional",
    desc: "Jiddiy, aniq va ekspert-maslahatchi",
  },
  {
    id: "funny",
    icon: "🎭",
    name: "Hazilkash",
    desc: "Quvnoq, hazilkash va pozitiv ruhdagi hamroh",
  },
  {
    id: "teacher",
    icon: "🧑‍🏫",
    name: "Ustoz",
    desc: "Sabrli, tushunarli va pedagogik uslub",
  },
  {
    id: "motivator",
    icon: "🚀",
    name: "Motivator",
    desc: "Maqsad va yutuqlarga ilhomlantiruvchi kuch",
  },
];

export const getPersonalityName = (id: string): string =>
  PERSONALITIES.find((p) => p.id === id)?.name || "Samimiy Do'st";

interface PersonalitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: PersonalityId;
  onSelect: (id: PersonalityId) => void;
}

const PersonalitySelectorModal: React.FC<PersonalitySelectorModalProps> = ({
  isOpen,
  onClose,
  current,
  onSelect,
}) => {
  return (
    <SuperAIModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xarakterni tanlang"
      icon="🎭"
    >
      <p
        style={{
          fontSize: "0.72rem",
          color: "#8fa7ba",
          marginBottom: "0.85rem",
          lineHeight: "1.5",
        }}
      >
        Xarakter suhbat uslubi, ovoz ohangi va javob xarakterini belgilaydi.

        Tanlangan xarakter SuperAI Virtual Do'st behavioriga darhol ta'sir qiladi.

      </p>
      <div className="vf-persona-grid">
        {PERSONALITIES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`vf-persona-card${current === p.id ? " vf-active" : ""}`}
            onClick={() => {
              onSelect(p.id);
              onClose();
            }}
            aria-pressed={current === p.id}
          >
            <span className="vf-persona-ico" aria-hidden="true">
              {p.icon}
            </span>
            <span className="vf-persona-name">{p.name}</span>
            <span className="vf-persona-desc">{p.desc}</span>
          </button>
        ))}
      </div>
    </SuperAIModal>
  );
};

export default PersonalitySelectorModal;