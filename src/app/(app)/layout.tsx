"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Menu, X } from "lucide-react";

const ROUTE_TITLES: Record<string, string> = {
  "/":              "Dashboard",
  "/animales":      "Animales",
  "/alimentacion":  "Alimentación",
  "/sanidad":       "Sanidad",
  "/reproduccion":  "Reproducción",
  "/destete":       "Destete",
  "/faena":         "Faena",
  "/movimientos":   "Movimientos",
  "/costos":        "Costos",
  "/estadisticas":  "Estadísticas",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const pageTitle = Object.entries(ROUTE_TITLES).find(([key]) =>
    key === "/" ? pathname === "/" : pathname.startsWith(key)
  )?.[1] ?? "VaniApp";

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg)" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--color-primary-muted)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="app-shell">
      {/* Drawer overlay — mobile only */}
      <div
        className={`drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Sidebar — desktop: static | mobile: fixed drawer */}
      <Sidebar drawerOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            className="mobile-topbar-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="mobile-topbar-title">{pageTitle}</span>
          {/* Spacer to center the title */}
          <div style={{ width: 36 }} />
        </div>

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}

