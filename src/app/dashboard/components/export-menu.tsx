"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

type ExportMenuProps = {
  exporting?: boolean;
  selectedCount?: number;
  onExportCsv: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
};

export default function ExportMenu({
  exporting = false,
  selectedCount = 0,
  onExportCsv,
  onExportPdf,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const label = exporting
    ? "Exporting..."
    : selectedCount > 0
      ? `Export (${selectedCount})`
      : "Export All";

  const runExport = async (handler: () => void | Promise<void>) => {
    setOpen(false);
    await handler();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={exporting}
        className="flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        <Download size={16} />
        {label}
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-48 overflow-hidden rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => void runExport(onExportCsv)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--app-text)] transition-colors hover:bg-white/5"
          >
            <FileSpreadsheet size={16} className="text-emerald-300" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void runExport(onExportPdf)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--app-text)] transition-colors hover:bg-white/5"
          >
            <FileText size={16} className="text-[var(--app-accent-strong)]" />
            <span>Export PDF</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
