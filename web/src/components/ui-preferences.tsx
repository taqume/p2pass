"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "tr";
export type Theme = "dark" | "light";

type Copy = { en: string; tr: string };
type Preferences = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  text: (copy: Copy) => string;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function UIPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("p2pass-theme") as Theme | null;
    const savedLanguage = localStorage.getItem("p2pass-language") as Language | null;
    const initialTheme = savedTheme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    const initialLanguage = savedLanguage || (navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en");
    setTheme(initialTheme);
    setLanguageState(initialLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("p2pass-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("p2pass-language", language);
  }, [language]);

  const value = useMemo<Preferences>(() => ({
    language,
    theme,
    setLanguage: setLanguageState,
    toggleTheme: () => setTheme(current => current === "dark" ? "light" : "dark"),
    text: copy => copy[language],
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useUIPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useUIPreferences must be used inside UIPreferencesProvider");
  return context;
}

export function Localized({ en, tr }: Copy) {
  const { text } = useUIPreferences();
  return <>{text({ en, tr })}</>;
}

