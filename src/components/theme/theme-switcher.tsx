"use client";

import { ThemeDots } from "./";

import { Palette } from "lucide-react";

import { useAppTheme } from "./theme-provider";
import FormSelect, { FormSelectOption } from "@/components/ui/form-select";
import { APP_SURFACE_STYLES, APP_THEMES } from "./theme-config";

type ThemeOptionKey = (typeof APP_THEMES)[number]["key"];
type SurfaceOptionKey = (typeof APP_SURFACE_STYLES)[number]["key"];



export default function ThemeSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { theme, setTheme, surfaceStyle, setSurfaceStyle } = useAppTheme();

  const activeTheme = APP_THEMES.find((item) => item.key === theme) ?? APP_THEMES[0];
  const themeOptions: Array<FormSelectOption<ThemeOptionKey>> = APP_THEMES.map((item) => ({
    value: item.key,
    label: item.label,
  }));
  const surfaceOptions: Array<FormSelectOption<SurfaceOptionKey>> = APP_SURFACE_STYLES.map(
    (item) => ({
      value: item.key,
      label: item.label,
    }),
  );

  if (compact) {
    return (
      <div className="w-full space-y-1.5">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
          {activeTheme.label}
        </p>
        <FormSelect
          value={theme}
          onChange={setTheme}
          options={themeOptions}
          size="sm"
          className="w-full"
          maxHeightClassName="max-h-[160px]"
          renderSelected={(option) => (
            <div className="flex items-center justify-center">
              {option ? <ThemeDots themeKey={option.value} small /> : null}
            </div>
          )}
          renderOption={({ option, active }) => (
            <div className="flex w-full items-center justify-between gap-3">
              <span className={active ? "text-[var(--app-accent-strong)]" : "text-[var(--app-text)]"}>
                {option.label}
              </span>
              <ThemeDots themeKey={option.value} small />
            </div>
          )}
        />
        <FormSelect
          value={surfaceStyle}
          onChange={setSurfaceStyle}
          options={surfaceOptions}
          size="sm"
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3">
      <div className="mb-3 flex items-center gap-2">
        <Palette size={16} className="text-[var(--app-accent-strong)]" />
        <p className="text-sm font-medium text-[var(--app-text)]">Theme</p>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
          {activeTheme.label}
        </p>
        <FormSelect
          value={theme}
          onChange={setTheme}
          options={themeOptions}
          size="sm"
          className="w-full"
          maxHeightClassName="max-h-[160px]"
          renderSelected={(option) => (
            <div className="flex items-center justify-center">
              {option ? <ThemeDots themeKey={option.value} /> : null}
            </div>
          )}
          renderOption={({ option, active }) => (
            <div className="flex w-full items-center justify-between gap-3">
              <span className={active ? "text-[var(--app-accent-strong)]" : "text-[var(--app-text)]"}>
                {option.label}
              </span>
              <ThemeDots themeKey={option.value} />
            </div>
          )}
        />
        <FormSelect
          value={surfaceStyle}
          onChange={setSurfaceStyle}
          options={surfaceOptions}
          size="sm"
          className="w-full"
        />
      </div>
    </div>
  );
}
