"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  APP_THEMES,
  APP_SURFACE_STYLE_STORAGE_KEY,
  APP_THEME_STORAGE_KEY,
  type AppSurfaceStyle,
  type AppThemeKey,
} from "@/lib/app-theme";

type ThemeContextValue = {
  theme: AppThemeKey;
  setTheme: (theme: AppThemeKey) => void;
  surfaceStyle: AppSurfaceStyle;
  setSurfaceStyle: (surfaceStyle: AppSurfaceStyle) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeKey(value: string | null): value is AppThemeKey {
  return APP_THEMES.some((theme) => theme.key === value);
}

function isSurfaceStyle(value: string | null): value is AppSurfaceStyle {
  return value === "glass" || value === "solid";
}

function getThemeMode(theme: AppThemeKey) {
  if (
    theme === "orange-steel" ||
    theme === "teal-mist" ||
    theme === "rose-paper" ||
    theme === "sky-paper"
  ) {
    return "light";
  }

  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeKey>(() => {
    if (typeof window === "undefined") {
      return "indigo";
    }

    const stored = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    return isThemeKey(stored) ? stored : "indigo";
  });
  const [surfaceStyle, setSurfaceStyleState] = useState<AppSurfaceStyle>(() => {
    if (typeof window === "undefined") {
      return "glass";
    }

    const stored = window.localStorage.getItem(APP_SURFACE_STYLE_STORAGE_KEY);
    return isSurfaceStyle(stored) ? stored : "glass";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.dataset.themeMode = getThemeMode(theme);
    document.body.dataset.themeMode = getThemeMode(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.surfaceStyle = surfaceStyle;
    document.body.dataset.surfaceStyle = surfaceStyle;
  }, [surfaceStyle]);

  const setTheme = (nextTheme: AppThemeKey) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(APP_THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    document.documentElement.dataset.themeMode = getThemeMode(nextTheme);
    document.body.dataset.themeMode = getThemeMode(nextTheme);
  };

  const setSurfaceStyle = (nextSurfaceStyle: AppSurfaceStyle) => {
    setSurfaceStyleState(nextSurfaceStyle);
    window.localStorage.setItem(APP_SURFACE_STYLE_STORAGE_KEY, nextSurfaceStyle);
    document.documentElement.dataset.surfaceStyle = nextSurfaceStyle;
    document.body.dataset.surfaceStyle = nextSurfaceStyle;
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      surfaceStyle,
      setSurfaceStyle,
    }),
    [theme, surfaceStyle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }

  return context;
}
