export type AppThemeKey =
  | "indigo"
  | "emerald"
  | "crimson"
  | "amber"
  | "orange-steel"
  | "teal-mist"
  | "rose-paper"
  | "sky-paper";
export type AppSurfaceStyle = "glass" | "solid";

export const APP_THEME_STORAGE_KEY = "app-theme";
export const APP_SURFACE_STYLE_STORAGE_KEY = "app-surface-style";

export const APP_THEMES: Array<{
  key: AppThemeKey;
  label: string;
  description: string;
  swatches: [string, string, string];
  compactLabel: string;
}> = [
  {
    key: "indigo",
    label: "Indigo Night",
    description: "Default deep indigo operations theme",
    swatches: ["#6366f1", "#8b5cf6", "#0f172a"],
    compactLabel: "🟣 🟣 ⚫",
  },
  {
    key: "emerald",
    label: "Emerald Ops",
    description: "Cool green accent with steel surfaces",
    swatches: ["#10b981", "#0ea5a4", "#0b1220"],
    compactLabel: "🟢 🟦 ⚫",
  },
  {
    key: "crimson",
    label: "Crimson Shift",
    description: "Warm red accent with dark graphite panels",
    swatches: ["#f43f5e", "#ef4444", "#111827"],
    compactLabel: "🔴 🔴 ⚫",
  },
  {
    key: "amber",
    label: "Amber Core",
    description: "Golden amber accent with darker navy base",
    swatches: ["#f59e0b", "#f97316", "#111827"],
    compactLabel: "🟡 🟠 ⚫",
  },
  {
    key: "orange-steel",
    label: "Orange Steel",
    description: "Orange, white, and gray with a cleaner industrial feel",
    swatches: ["#f97316", "#f8fafc", "#6b7280"],
    compactLabel: "🟠 ⚪ ⚫",
  },
  {
    key: "teal-mist",
    label: "Teal Mist",
    description: "Soft teal, white, and cool gray in a lighter office palette",
    swatches: ["#0f766e", "#f8fafc", "#94a3b8"],
    compactLabel: "🟢 ⚪ ⚪",
  },
  {
    key: "rose-paper",
    label: "Rose Paper",
    description: "Rose accent with clean white and muted gray surfaces",
    swatches: ["#e11d48", "#fffafc", "#9ca3af"],
    compactLabel: "🩷 ⚪ ⚪",
  },
  {
    key: "sky-paper",
    label: "Sky Paper",
    description: "Light blue, white, and steel gray with a soft dashboard tone",
    swatches: ["#0284c7", "#f8fbff", "#94a3b8"],
    compactLabel: "🔵 ⚪ ⚪",
  },
];

export const APP_SURFACE_STYLES: Array<{
  key: AppSurfaceStyle;
  label: string;
  description: string;
}> = [
  {
    key: "glass",
    label: "Glass",
    description: "Soft translucent panels with blur",
  },
  {
    key: "solid",
    label: "Solid",
    description: "Dense surfaces without glassmorphism",
  },
];
