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
    description: "Deep indigo operations with violet accents",
    swatches: ["#818cf8", "#c084fc", "#0f172a"],
    compactLabel: "🟣 🟣 ⚫",
  },
  {
    key: "emerald",
    label: "Emerald Ops",
    description: "Cyber green accent with deep forest base",
    swatches: ["#34d399", "#2dd4bf", "#061311"],
    compactLabel: "🟢 🟦 ⚫",
  },
  {
    key: "crimson",
    label: "Crimson Shift",
    description: "Rich ruby red with obsidian graphite",
    swatches: ["#fb7185", "#f43f5e", "#0f1115"],
    compactLabel: "🔴 🔴 ⚫",
  },
  {
    key: "amber",
    label: "Amber Core",
    description: "Vibrant golden amber with charcoal navy",
    swatches: ["#fbbf24", "#fb923c", "#0f141e"],
    compactLabel: "🟡 🟠 ⚫",
  },
  {
    key: "orange-steel",
    label: "Orange Steel",
    description: "Industrial orange with clean slate surfaces",
    swatches: ["#f97316", "#cbd5e1", "#475569"],
    compactLabel: "🟠 ⚪ ⚫",
  },
  {
    key: "teal-mist",
    label: "Teal Mist",
    description: "Premium teal with professional grey tones",
    swatches: ["#2dd4bf", "#f1f5f9", "#64748b"],
    compactLabel: "🟢 ⚪ ⚪",
  },
  {
    key: "rose-paper",
    label: "Rose Paper",
    description: "Elegant rose on soft parchment surfaces",
    swatches: ["#f43f5e", "#fff7f9", "#94a3b8"],
    compactLabel: "🩷 ⚪ ⚪",
  },
  {
    key: "sky-paper",
    label: "Sky Paper",
    description: "Crystal blue with clean cloud-white bases",
    swatches: ["#38bdf8", "#f0f9ff", "#64748b"],
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
