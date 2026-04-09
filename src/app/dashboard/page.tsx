"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth-store";
import LoginPage from "@/components/auth/login-page";
import AppLayout from "@/components/layout/app-layout";
import LogoImage from "@/components/ui/logo-image";

// External store for language to avoid setState in effects
function getLanguageSnapshot(): "ar" | "en" {
  if (typeof window === "undefined") return "ar";
  return (localStorage.getItem("blueprint-lang") as "ar" | "en") || "ar";
}

function getLanguageServerSnapshot(): "ar" | "en" {
  return "ar";
}

function subscribeToLanguage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  // Custom event for same-window changes
  window.addEventListener("blueprint-lang-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("blueprint-lang-change", callback);
  };
}

function setLanguageExternal(lang: "ar" | "en") {
  localStorage.setItem("blueprint-lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  window.dispatchEvent(new Event("blueprint-lang-change"));
}

function useLanguageExternal(): "ar" | "en" {
  return useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getLanguageServerSnapshot);
}

function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const language = useLanguageExternal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("blueprint-lang") as "ar" | "en" | null;
    if (stored) {
      document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = stored;
    }
    // Use requestAnimationFrame to avoid the cascading render warning
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center animate-pulse">
            <LogoImage size={40} />
          </div>
          <span className="text-sm text-white/60">BluePrint</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage language={language} />;
  }

  return <AppLayout language={language} />;
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
