import Link from "next/link";
import { ProductPageId } from "../lib/domain";

const NAV_ITEMS: { id: ProductPageId; href: string; label: string; blurb: string }[] = [
  { id: "explorer", href: "/", label: "Explorer", blurb: "Screen funding across venues" },
  { id: "trend", href: "/trend", label: "Trend", blurb: "Current vs historical regime" },
  { id: "compare", href: "/compare", label: "Compare", blurb: "Best venue by asset" },
  { id: "spread", href: "/spread", label: "Spread", blurb: "Long/short venue arb" },
  { id: "hedge", href: "/hedge", label: "Hedge", blurb: "Boros implied vs funding" },
];

export function AppShell({
  page,
  children,
}: {
  page: ProductPageId;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p>Funding</p>
          <h1>Explorer V2</h1>
          <span>Explorer-first MVP with backend-ready structure.</span>
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
          <span>UI shell + mock domain model + DB/API blueprint</span>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
