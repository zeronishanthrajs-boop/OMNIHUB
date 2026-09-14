import { create } from "zustand";

export type Language = "en" | "ml";
export type ResponseSpeed = "fast" | "balanced" | "detailed";

interface SettingsState {
  language: Language;
  speed: ResponseSpeed;
  wakeWord: boolean;
  theme: "dark" | "light" | "auto";
  setLanguage: (language: Language) => void;
  setSpeed: (speed: ResponseSpeed) => void;
  setWakeWord: (wakeWord: boolean) => void;
  setTheme: (theme: "dark" | "light" | "auto") => void;
}

const initialLanguage = (): Language => {
  const stored = window.localStorage.getItem("jarvis_lang");
  if (stored === "ml" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("ml") ? "ml" : "en";
};

export const useSettingsStore = create<SettingsState>((set) => ({
  language: initialLanguage(),
  speed: "balanced",
  wakeWord: true,
  theme: "dark",
  setLanguage: (language) => {
    window.localStorage.setItem("jarvis_lang", language);
    set({ language });
  },
  setSpeed: (speed) => set({ speed }),
  setWakeWord: (wakeWord) => set({ wakeWord }),
  setTheme: (theme) => {
    window.localStorage.setItem("jarvis_theme", theme);
    set({ theme });
  }
}));
