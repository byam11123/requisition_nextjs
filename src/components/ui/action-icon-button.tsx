"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MouseEventHandler } from "react";

type ActionIconButtonTone =
  | "slate"
  | "indigo"
  | "sky"
  | "emerald"
  | "purple"
  | "rose";

type SharedProps = {
  icon: LucideIcon;
  label: string;
  tone?: ActionIconButtonTone;
  size?: "sm" | "md";
  target?: string;
  rel?: string;
  id?: string;
  className?: string;
};

type LinkProps = SharedProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ButtonProps = SharedProps & {
  href?: never;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

type ActionIconButtonProps = LinkProps | ButtonProps;

const toneClasses: Record<ActionIconButtonTone, string> = {
  slate: "text-[var(--app-muted)] hover:bg-white/5 hover:text-[var(--app-text)]",
  indigo: "text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent-strong)]",
  sky: "text-[var(--app-muted)] hover:bg-sky-500/10 hover:text-sky-400",
  emerald: "text-[var(--app-muted)] hover:bg-emerald-500/10 hover:text-emerald-400",
  purple: "text-[var(--app-muted)] hover:bg-purple-500/10 hover:text-purple-400",
  rose: "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200",
};

const sizeClasses = {
  sm: "rounded-lg p-1.5",
  md: "rounded-lg p-2",
};

export default function ActionIconButton(props: ActionIconButtonProps) {
  const {
    icon: Icon,
    label,
    tone = "indigo",
    size = "md",
    id,
    className = "",
  } = props;

  const classes = `${sizeClasses[size]} inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClasses[tone]} ${className}`.trim();

  if (props.href) {
    return (
      <Link
        id={id}
        href={props.href}
        target={props.target}
        rel={props.rel}
        aria-label={label}
        title={label}
        className={classes}
      >
        <Icon size={size === "sm" ? 16 : 18} />
      </Link>
    );
  }

  return (
    <button
      id={id}
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={label}
      title={label}
      className={classes}
    >
      <Icon size={size === "sm" ? 16 : 18} />
    </button>
  );
}

