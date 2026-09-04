import React from "react";

// ================= SUPERAI DESIGN SYSTEM =================

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`glass rounded-2xl p-5 border-white/10 ${className}`}
  >
    {children}
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  type = "button",
}) => {
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40",
    secondary:
      "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10",
    danger:
      "bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/40",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-bold transition-all ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  onKeyDown,
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    className={`px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 ${className}`}
  />
);

export const TextArea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ value, onChange, placeholder, rows = 3, className = "" }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className={`w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none ${className}`}
  />
);

export const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}> = ({ value, onChange, options, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-200 outline-none ${className}`}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-slate-900">
        {opt.label}
      </option>
    ))}
  </select>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple" | "slate";
  className?: string;
}> = ({ children, color = "blue", className = "" }) => {
  const colors = {
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/20 text-red-300 border-red-500/30",
    yellow: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    slate: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
};

export const EmptyState: React.FC<{
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="glass rounded-2xl p-10 text-center border-white/10">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-black text-white">{title}</h3>
    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
      {description}
    </p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const LoadingSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="glass rounded-2xl p-5 border-white/10 animate-pulse"
      >
        <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
      </div>
    ))}
  </div>
);

export const PageHeader: React.FC<{
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black text-white">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-slate-400 max-w-xl">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    )}
  </header>
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} glass rounded-3xl border border-white/20 shadow-2xl p-6 max-h-[80vh] overflow-y-auto custom-scrollbar`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Tabs: React.FC<{
  tabs: { id: string; label: string; icon?: string }[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
          active === tab.id
            ? "bg-blue-600 text-white"
            : "bg-slate-800/60 text-slate-400 hover:text-white"
        }`}
      >
        {tab.icon && <span className="mr-1">{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
);

export const ProgressBar: React.FC<{
  progress: number;
  statusText?: string;
  color?: string;
}> = ({ progress, statusText, color = "bg-blue-500" }) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-bold text-slate-300">{statusText}</span>
      <span className="text-xs font-black text-slate-400">
        {Math.round(progress)}%
      </span>
    </div>
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

export const Toast: React.FC<{
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}> = ({ message, type = "info", onClose }) => {
  const colors = {
    success: "bg-emerald-600/90 border-emerald-400/50",
    error: "bg-red-600/90 border-red-400/50",
    info: "bg-blue-600/90 border-blue-400/50",
  };
  return (
    <div
      className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[200] px-5 py-3 rounded-2xl border text-white text-sm font-bold shadow-2xl animate-fade-in max-w-[calc(100%-2rem)] sm:max-w-sm safe-area-bottom ${colors[type]}`}
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
};
