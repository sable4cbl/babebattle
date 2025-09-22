import React, { useEffect, useState } from "react";

type Theme = "light" | "dark" | "battle";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove("theme-light", "theme-dark", "theme-battle");
  body.classList.remove("theme-light", "theme-dark", "theme-battle");
  const cls = t === "light" ? "theme-light" : t === "dark" ? "theme-dark" : "theme-battle";
  root.classList.add(cls);
  body.classList.add(cls);
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "light");
  useEffect(() => { applyTheme(theme); localStorage.setItem("theme", theme); }, [theme]);

  const Btn = ({ value, label, title }: { value: Theme; label: string; title: string }) => (
    <button
      className={("text-xs w-8 h-8 inline-flex items-center justify-center rounded-full border shadow-sm transition-colors " +
        (theme === value ? "bg-blue-600 text-white border-blue-600" : "bg-white/90 hover:bg-white"))}
      onClick={() => setTheme(value)}
      aria-label={title}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2 bg-white/70 backdrop-blur rounded-full p-1 border">
      <Btn value="light" label="☀️" title="Light theme" />
      <Btn value="dark" label="🌙" title="Dark theme" />
      <Btn value="battle" label="💖" title="Babe Battle" />
    </div>
  );
}
