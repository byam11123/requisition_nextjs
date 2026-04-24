"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import Image from "next/image";

type ImagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
};

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title,
}: ImagePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [domReady, setDomReady] = useState(false);

  useEffect(() => {
    setDomReady(true);
  }, []);

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

  if (!domReady || (!isOpen && !mounted)) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={`relative flex h-screen w-screen flex-col items-center justify-center transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-105 opacity-0"
        }`}
      >
        {/* Header/Controls - Floating glass top bar */}
        <div className="absolute top-0 z-10 flex w-full items-center justify-between px-6 py-6 text-white bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex flex-col">
            <h3 className="text-base font-bold tracking-tight text-white">
              {title}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
              Media Preview
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
              title="Download Original"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={22} />
            </a>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition-all hover:bg-rose-500/30 hover:text-rose-200 active:scale-95"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Image Wrapper - Maximize space */}
        <div 
          className="relative h-full w-full p-4 sm:p-12 md:p-20"
          onClick={onClose}
        >
          <div 
            className="relative h-full w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>
        
        {/* Helper Hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 rounded-full bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30 backdrop-blur-md border border-white/10">
          ESC to Close / Scroll to Zoom (Browser)
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
