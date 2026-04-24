"use client";

import { APP_THEMES, type AppThemeKey } from "./theme-config";

type ThemeDotsProps = {
  themeKey: AppThemeKey;
  small?: boolean;
};

export default function ThemeDots({
  themeKey,
  small = false,
}: ThemeDotsProps) {
  const option = APP_THEMES.find((item) => item.key === themeKey);
  if (!option) {
    return null;
  }

  return (
    <div className={`flex items-center ${small ? "gap-1.5" : "gap-2"}`}>
      {option.swatches.map((swatch) => (
        <span
          key={swatch}
          className={small ? "h-2.5 w-2.5 rounded-full" : "h-3 w-3 rounded-full"}
          style={{ backgroundColor: swatch }}
        />
      ))}
    </div>
  );
}
