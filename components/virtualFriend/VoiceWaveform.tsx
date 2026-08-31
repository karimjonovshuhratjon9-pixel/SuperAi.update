import React from "react";

interface VoiceWaveformProps {
  /** Animated when true; static whisper otherwise. */
  active: boolean;
  tone?: "ai" | "user";
  bars?: number;
  label?: string;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  active,
  tone = "ai",
  bars = 16,
  label,
}) => {
  const items = Array.from({ length: bars }, (_, i) => {
    const h = 4 + Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.9 + 1)) * 18;
    return (
      <span
        key={i}
        style={{ height: `${h.toFixed(1)}px`, animationDelay: `${(i % 7) * 0.07}s` }}
      />
    );
  });

  return (
    <div
      className={`vf-waveform${active ? " vf-active" : ""}${tone === "user" ? " vf-user" : ""}`}
      role="status"
      aria-label={label ?? (active ? "Ovozli faollik" : "Ovoz jim")}
    >
      {items}
    </div>
  );
};

export default VoiceWaveform;