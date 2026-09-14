import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ml from "./ml.json";

const detected = window.localStorage.getItem("jarvis_lang") ?? (navigator.language.toLowerCase().startsWith("ml") ? "ml" : "en");

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ml: { translation: ml } },
  lng: detected,
  fallbackLng: "en",
  interpolation: { escapeValue: true }
});

export default i18n;
