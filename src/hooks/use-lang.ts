"use client";

import { useSyncExternalStore } from "react";

// ===== Shared Language Hook =====
// Centralized language detection to avoid duplication across 10+ page components.

function getLangSnapshot(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("blueprint-lang") as "ar" | "en") || "ar";
}

function getServerSnapshot(): "ar" | "en" {
  return "ar";
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener("blueprint-lang-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("blueprint-lang-change", cb);
  };
}

/**
 * Returns the current language from localStorage.
 * Usage: `const lang = useLang(); const ar = lang === "ar";`
 */
export function useLang(): "ar" | "en" {
  return useSyncExternalStore(subscribe, getLangSnapshot, getServerSnapshot);
}

/**
 * Extended language hook that also provides helper functions.
 * Usage: `const { lang, ar, t } = useLanguage();`
 */
export function useLanguage() {
  const lang = useLang();
  const ar = lang === "ar";
  const t = (arText: string, enText: string) => (ar ? arText : enText);
  return { lang, ar, t };
}
