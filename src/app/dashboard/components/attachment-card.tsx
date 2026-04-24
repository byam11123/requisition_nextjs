"use client";

import Image from "next/image";
import { Upload, ZoomIn } from "lucide-react";
import { useState } from "react";
import ImagePreviewModal from "@/components/ui/image-preview-modal";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const displayUrl = localUrl || url;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--app-border)] p-3 bg-[var(--app-panel)]/30 transition-all hover:bg-[var(--app-panel)]/50">
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">{title}</p>

      {displayUrl ? (
        <button
          type="button"
          className={`group relative overflow-hidden rounded-xl bg-black/20 ${previewClassName}`}
          onClick={() => setIsPreviewOpen(true)}
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
          className={`flex items-center justify-center rounded-xl bg-black/10 text-sm italic text-[var(--app-muted)]/60 ${previewClassName}`}
        >
          {emptyLabel}
        </div>
      )}

      {canUpload ? (
        <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--app-accent)] mt-1">
          <Upload size={13} className="shrink-0" />
          <span>{displayUrl ? "Replace" : "Upload"}</span>
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={onUpload}
          />
        </label>
      ) : null}

      {displayUrl && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          imageUrl={displayUrl}
          title={title}
        />
      )}
    </div>
  );
}
