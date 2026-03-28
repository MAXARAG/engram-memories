"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Beef,
  Wheat,
  Syringe,
  Heart,
  Baby,
  Scissors,
  ArrowLeftRight,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Leaf,
  ChevronRight,
} from "lucide-react";

// ─── Nav Items ─────────────────────────────────────────────────────────────────

const navItems = [
  { href: "/",            label: "Dashboard",    icon: LayoutDashboard },
  { href: "/animales",    label: "Animales",     icon: Beef            },
  { href: "/alimentacion",label: "Alimentación", icon: Wheat           },
  { href: "/sanidad",     label: "Sanidad",      icon: Syringe         },
  { href: "/reproduccion",label: "Reproducción", icon: Heart           },
  { href: "/destete",     label: "Destete",      icon: Baby            },
  { href: "/faena",       label: "Faena",        icon: Scissors        },
  { href: "/movimientos", label: "Movimientos",  icon: ArrowLeftRight  },
  { href: "/costos",      label: "Costos",       icon: DollarSign      },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem 1.25rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #3d7a35, #8B6914)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Leaf size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              VaniApp
            </div>
            <div
              style={{
                fontSize: "0.6875rem",
                color: "rgba(197, 217, 194, 0.7)",
                marginTop: 2,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Gestión Agropecuaria
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section label */}
        <div
          style={{
            padding: "0.25rem 1.75rem 0.5rem",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(197, 217, 194, 0.4)",
          }}
        >
          Módulos
        </div>

        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-nav-item${isActive(href) ? " active" : ""}`}
          >
            <Icon size={17} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {isActive(href) && (
              <ChevronRight size={14} style={{ opacity: 0.5 }} />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer — user + logout */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "1rem 0.75rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.5rem 0.5rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "0.25rem",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3d7a35, #8B6914)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {user?.nombre
              ? user.nombre[0].toUpperCase()
              : user?.username?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.nombre ?? user?.username ?? "Usuario"}
            </div>
            {user?.rol && (
              <div
                style={{
                  fontSize: "0.6875rem",
                  color: "rgba(197, 217, 194, 0.6)",
                }}
              >
                {user.rol}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={logout}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            color: "rgba(197, 217, 194, 0.7)",
            fontSize: "0.875rem",
            transition: "background 0.15s ease, color 0.15s ease",
            opacity: isLoading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(185, 28, 28, 0.2)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(197, 217, 194, 0.7)";
          }}
        >
          <LogOut size={15} strokeWidth={2} />
          {isLoading ? "Saliendo..." : "Cerrar sesión"}
        </button>
      </div>
    </aside>
  );
}
