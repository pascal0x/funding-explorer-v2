"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductPageId } from "../lib/domain";

const NAV_ITEMS: { id: ProductPageId; href: string; label: string; blurb: string }[] = [
  { id: "explorer", href: "/", label: "Explorer", blurb: "Screen funding across venues" },
  { id: "trend", href: "/trend", label: "Trend", blurb: "Current vs historical regime" },
  { id: "compare", href: "/compare", label: "Compare", blurb: "Best venue by asset" },
  { id: "spread", href: "/spread", label: "Spread", blurb: "Long/short venue arb" },
  { id: "hedge", href: "/hedge", label: "Hedge", blurb: "Boros implied vs funding" },
];

type ThemeMode = "light" | "dark" | "auto";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.theme = resolved;
}

export function AppShell({
  page,
  children,
}: {
  page: ProductPageId;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("funding-theme");
    const storedCollapsed = window.localStorage.getItem("funding-sidebar-collapsed");
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "auto"
        ? storedTheme
        : "auto";

    setThemeMode(initialTheme);
    applyTheme(initialTheme);

    if (storedCollapsed === "true") {
      setCollapsed(true);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(initialTheme);
    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, []);

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    window.localStorage.setItem("funding-theme", mode);
    applyTheme(mode);
  }

  function handleCollapsedToggle() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("funding-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className={collapsed ? "app-shell app-shell-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">
              <p>Funding</p>
              <h1>Explorer V2</h1>
              <span>Explorer-first MVP with backend-ready structure.</span>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={handleCollapsedToggle}
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            >
              {collapsed ? "→" : "←"}
            </button>
          </div>

          <div className="theme-switcher">
            {(["light", "dark", "auto"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={themeMode === mode ? "theme-button theme-button-active" : "theme-button"}
                onClick={() => handleThemeChange(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={item.id === page ? "nav-item nav-item-active" : "nav-item"}
            >
              <strong>{item.label}</strong>
              <span>{item.blurb}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <p>Phase 1</p>
          <span>UI shell + live venue adapters + Explorer UX pass</span>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
