"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FormSelectOption<T extends string> = {
  value: T;
  label: string;
};

type FormSelectRenderContext<T extends string> = {
  option: FormSelectOption<T>;
  active: boolean;
  highlighted: boolean;
};

type FormSelectProps<T extends string> = {
  value: T;
  options: FormSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
  size?: "default" | "sm";
  maxHeightClassName?: string;
  renderSelected?: (option: FormSelectOption<T> | undefined) => React.ReactNode;
  renderOption?: (context: FormSelectRenderContext<T>) => React.ReactNode;
};

export default function FormSelect<T extends string>({
  value,
  options,
  onChange,
  className = "",
  disabled = false,
  name,
  placeholder,
  size = "default",
  maxHeightClassName = "max-h-48",
  renderSelected,
  renderOption,
}: FormSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const buttonSizeClass =
    size === "sm" ? "gap-2 rounded-2xl px-3 py-2 text-xs" : "gap-3 rounded-2xl px-4 py-3 text-sm";
  const optionSizeClass =
    size === "sm" ? "rounded-xl px-2.5 py-2 text-xs" : "rounded-xl px-3 py-2.5 text-sm";

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
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const commitSelection = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex(selectedIndex);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        Math.min(options.length - 1, current + 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) {
        commitSelection(option.value);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen((current) => {
            const next = !current;
            if (next) {
              setHighlightedIndex(selectedIndex);
            }
            return next;
          })
        }
        onKeyDown={handleButtonKeyDown}
        className={`flex w-full items-center justify-between border border-[var(--app-border)] bg-[var(--app-panel)] text-left text-[var(--app-text)] outline-none transition-colors hover:border-[var(--app-border-strong)] focus:border-[var(--app-accent-border)] disabled:cursor-not-allowed disabled:opacity-70 ${buttonSizeClass}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`min-w-0 flex-1 ${selectedOption ? "text-[var(--app-text)]" : "text-[var(--app-muted)]"}`}
        >
          {renderSelected
            ? renderSelected(selectedOption)
            : selectedOption?.label || placeholder || "Select option"}
        </span>
        <ChevronDown
          size={size === "sm" ? 14 : 16}
          className={`shrink-0 text-[var(--app-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-2xl border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] shadow-2xl shadow-black/40"
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          <div className={`overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-[var(--app-muted)] ${maxHeightClassName}`}>
            {options.map((option, index) => {
              const active = option.value === value;
              const highlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commitSelection(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-[var(--app-accent-soft)]/60 text-[var(--app-accent-strong)] shadow-inner"
                      : highlighted
                        ? "bg-white/[0.06] text-[var(--app-text)]"
                        : "text-[var(--app-text)]/80 hover:text-[var(--app-text)]"
                  } ${optionSizeClass}`}
                >
                  {renderOption ? (
                    renderOption({ option, active, highlighted })
                  ) : (
                    <>
                      <span>{option.label}</span>
                      {active ? (
                        <Check size={15} className="text-[var(--app-accent-strong)]" />
                      ) : null}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

