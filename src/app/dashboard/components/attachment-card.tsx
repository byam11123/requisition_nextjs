"use client";

import Image from "next/image";
import { Upload, ZoomIn } from "lucide-react";

type AttachmentCardProps = {
  title: string;
  url?: string | null;
  localUrl?: string | null;
  onUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  canUpload?: boolean;
  emptyLabel?: string;
  previewClassName?: string;
  imageClassName?: string;
};

export default function AttachmentCard({
  title,
  url,
  localUrl,
  onUpload,
  canUpload = false,
  emptyLabel = "No file",
  previewClassName = "h-24",
  imageClassName = "object-contain",
}: AttachmentCardProps) {
  const displayUrl = localUrl || url;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 p-3">
      <p className="text-center text-xs font-medium text-slate-500">{title}</p>

      {displayUrl ? (
        <button
          type="button"
          className={`group relative overflow-hidden rounded-xl bg-slate-950/50 ${previewClassName}`}
          onClick={() => window.open(displayUrl, "_blank")}
        >
          <Image
            src={displayUrl}
            alt={title}
            fill
            unoptimized
            className={`transition-transform group-hover:scale-105 ${imageClassName}`}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn size={18} className="text-white" />
          </div>
        </button>
      ) : (
        <div
          className={`flex items-center justify-center rounded-xl bg-slate-950/30 text-xs text-slate-600 ${previewClassName}`}
        >
          {emptyLabel}
        </div>
      )}

      {canUpload ? (
        <label className="flex cursor-pointer items-center justify-center gap-1 text-xs text-slate-500 transition-colors hover:text-indigo-400">
          <Upload size={12} />
          {displayUrl ? "Replace" : "Upload"}
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={onUpload}
          />
        </label>
      ) : null}
    </div>
  );
}
