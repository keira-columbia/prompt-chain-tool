"use client";
import { useEffect, useState } from "react";

export default function ThemePicker() {
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("prompt-chain-theme") || "system";
    // Restore the browser-only preference after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);
  function change(value) {
    setTheme(value);
    localStorage.setItem("prompt-chain-theme", value);
    document.documentElement.dataset.theme = value;
  }
  return <label className="theme-picker"><span>THEME</span><select value={theme} onChange={(event) => change(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
