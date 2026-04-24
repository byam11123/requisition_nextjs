"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "warning" | "info";
  loading?: boolean;
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  const toneClasses = {
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20",
    warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20",
    info: "bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] shadow-[var(--app-accent)]/20",
  };

  const iconClasses = {
    danger: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    info: "text-[var(--app-accent-strong)] bg-[var(--app-accent-soft)] border-[var(--app-accent-border)]",
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md transform rounded-[2rem] border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] p-8 shadow-2xl transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-xl p-1 text-[var(--app-muted)] transition-colors hover:bg-white/5 hover:text-[var(--app-text)]"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border ${iconClasses[tone]}`}
          >
            <AlertTriangle size={32} />
          </div>

          <h3 className="mb-2 text-2xl font-bold text-[var(--app-text)]">
            {title}
          </h3>
          <p className="mb-8 text-[var(--app-muted)] leading-relaxed">
            {message}
          </p>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] px-6 py-3.5 text-sm font-semibold text-[var(--app-text)] transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={loading}
              className={`flex-1 rounded-2xl px-6 py-3.5 text-sm font-semibold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${toneClasses[tone]} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
