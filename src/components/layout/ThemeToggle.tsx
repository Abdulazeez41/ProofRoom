"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("proofroom_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: "light" | "dark" =
      saved === "dark" || saved === "light"
        ? saved
        : prefersDark
        ? "dark"
        : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    document.documentElement.setAttribute("data-theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("proofroom_theme", next);
  };

  if (!mounted) {
    return <div className="w-11 h-11" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-line text-muted hover:text-ink hover:bg-line/20 transition-colors ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-warn" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-ink" aria-hidden="true" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
