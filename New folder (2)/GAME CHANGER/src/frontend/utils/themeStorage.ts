const THEME_STORAGE_KEY = "morphcart:theme";
const THEME_EVENT_NAME = "morphcart:theme-updated";

export type ThemeMode = "light" | "dark";

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function writeTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT_NAME));
}

export function toggleTheme(): ThemeMode {
  const current = readTheme();
  const next = current === "light" ? "dark" : "light";
  writeTheme(next);
  return next;
}

export const themeUpdateEvent = THEME_EVENT_NAME;
