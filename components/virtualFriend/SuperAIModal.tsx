import React, { useEffect, useRef } from "react";

interface SuperAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
}

const SuperAIModal: React.FC<SuperAIModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="vf-modal-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="vf-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vf-modal-head">
          {icon && (
            <span aria-hidden="true" className="text-base">
              {icon}
            </span>
          )}
          <h3 className="vf-modal-title">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            className="vf-modal-close"
            onClick={onClose}
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>
        <div className="vf-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default SuperAIModal;