"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ActionToastProps = {
  message: string;
  tone?: "success" | "error";
  onClose: () => void;
};

export default function ActionToast({
  message,
  tone = "success",
  onClose,
}: ActionToastProps) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border-rose-500/20 bg-rose-500/10 text-rose-300";

  return (
    <div className="fixed right-6 top-6 z-[70] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl ${toneClasses}`}
      >
        <div className="mt-0.5">
          {tone === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-current/70 transition-colors hover:bg-white/10 hover:text-current"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
