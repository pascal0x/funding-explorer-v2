"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductPageId } from "../lib/domain";

const NAV_ITEMS: { id: ProductPageId; href: string; label: string; blurb: string; icon: string }[] = [
  { id: "explorer", href: "/", label: "Explorer", blurb: "Explore funding rates", icon: "◫" },
  { id: "trend", href: "/trend", label: "Trend", blurb: "Analyse funding rate momentum", icon: "∿" },
  { id: "compare", href: "/compare", label: "Compare", blurb: "Find the best funding rates", icon: "≡" },
  { id: "spread", href: "/spread", label: "Spread", blurb: "Find the highest spread", icon: "⇄" },
  { id: "hedge", href: "/hedge", label: "Swaps", blurb: "Funding rate swap", icon: "◎" },
];

const THEME_OPTIONS = [
  { mode: "light", icon: "◐", label: "Light" },
  { mode: "dark", icon: "☾", label: "Dark" },
  { mode: "auto", icon: "◌", label: "Auto" },
] as const;

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
      <aside className="sidebar sidebar-refined">
        <div className="sidebar-top sidebar-top-refined">
          <div className="sidebar-brand-row sidebar-brand-row-refined">
            <div className="sidebar-brand sidebar-brand-refined">
              <p>Funding Desk</p>
              <h1>{page === "hedge" ? "Swaps" : NAV_ITEMS.find((item) => item.id === page)?.label}</h1>
              <span>{NAV_ITEMS.find((item) => item.id === page)?.blurb}</span>
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

          <nav className="sidebar-nav sidebar-nav-refined">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={item.id === page ? "nav-item nav-item-active nav-item-refined" : "nav-item nav-item-refined"}
              >
                <span className="nav-icon">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.blurb}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-foot sidebar-foot-refined">
          <div className="rail-theme-footer">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.mode}
                type="button"
                className={themeMode === option.mode ? "theme-icon-button theme-icon-button-active" : "theme-icon-button"}
                onClick={() => handleThemeChange(option.mode)}
                aria-label={option.label}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
          <span className="rail-version">v0.1.0</span>
        </div>
      </aside>

      <main className="main-panel main-panel-refined">{children}</main>
    </div>
  );
}
