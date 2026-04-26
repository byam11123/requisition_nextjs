"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FilterDropdownOption<T extends string> = {
  value: T;
  label: string;
};

type FilterDropdownProps<T extends string> = {
  label: string;
  value: T;
  options: FilterDropdownOption<T>[];
  onChange: (value: T) => void;
  minWidthClassName?: string;
};

export default function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  minWidthClassName = "min-w-0 sm:min-w-[170px]",
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeLabel =
    options.find((option) => option.value === value)?.label || label;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${minWidthClassName}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-2.5 text-left text-sm text-[var(--app-text)] transition-colors hover:border-[var(--app-border-strong)] focus:border-[var(--app-accent-border)] focus:outline-none"
      >
        <span className="truncate text-[var(--app-text)]">{activeLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[var(--app-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] shadow-2xl shadow-black/40">
          <div className="p-1.5">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]"
                      : "text-[var(--app-text)] hover:bg-white/5"
                  }`}
                >
                  <span>{option.label}</span>
                  {active ? <Check size={15} className="text-[var(--app-accent-strong)]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

