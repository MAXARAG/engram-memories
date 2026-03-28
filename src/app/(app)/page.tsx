"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getStats } from "@/lib/api";
import type { Stats } from "@/types";
import {
  Beef,
  Syringe,
  Baby,
  DollarSign,
  TrendingUp,
  Leaf,
  Calendar,
  BarChart3,
} from "lucide-react";

// ─── Stat Card Component ──────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="stat-card animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              marginBottom: "0.375rem",
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} color="#fff" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

// ─── Species Pill ──────────────────────────────────────────────────────────────

function SpeciesBadge({ especie, total }: { especie: string; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.625rem 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--color-primary)",
          }}
        />
        <span style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>
          {especie}
        </span>
      </div>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--color-primary-dark)",
        }}
      >
        {total}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
      })
      .catch(() => {
        // Use placeholder data if API not configured yet
        setStats({
          totalAnimales: 0,
          porEspecie: [],
          proximasVacunas: 0,
          partosEsperados: 0,
          costosMes: 0,
          ultimaActualizacion: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <Leaf size={16} color="var(--color-accent)" strokeWidth={2} />
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-accent)",
            }}
          >
            Resumen del establecimiento
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--color-primary-dark)",
          }}
        >
          {greeting()}, {user?.nombre ?? user?.username ?? "bienvenido"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: "1rem" }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 120,
                background: "var(--color-border)",
                borderRadius: "var(--radius-lg)",
                animation: "pulse 1.5s ease infinite",
              }}
            />
          ))}
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.5; }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div
            className="stagger"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2rem",
            }}
          >
            <StatCard
              title="Total Animales"
              value={stats?.totalAnimales ?? 0}
              subtitle="en el establecimiento"
              icon={Beef}
              color="var(--color-primary)"
              delay={0}
            />
            <StatCard
              title="Próximas Vacunas"
              value={stats?.proximasVacunas ?? 0}
              subtitle="en los próximos 7 días"
              icon={Syringe}
              color="#0891b2"
              delay={60}
            />
            <StatCard
              title="Partos Esperados"
              value={stats?.partosEsperados ?? 0}
              subtitle="en los próximos 30 días"
              icon={Baby}
              color="#7c3aed"
              delay={120}
            />
            <StatCard
              title="Costos del Mes"
              value={stats ? formatCurrency(stats.costosMes) : "$0"}
              subtitle="gastos registrados"
              icon={DollarSign}
              color="var(--color-accent)"
              delay={180}
            />
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
            }}
          >
            {/* Por especie */}
            <div className="card animate-fade-in" style={{ animationDelay: "240ms" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <BarChart3 size={18} color="var(--color-primary)" />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-primary-dark)",
                  }}
                >
                  Stock por especie
                </h3>
              </div>

              {stats?.porEspecie && stats.porEspecie.length > 0 ? (
                <div>
                  {stats.porEspecie.map((s) => (
                    <SpeciesBadge key={s.especie} especie={s.especie} total={s.total} />
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <Beef size={32} className="empty-state-icon" />
                  <p style={{ fontSize: "0.875rem" }}>Sin datos de stock todavía</p>
                </div>
              )}
            </div>

            {/* Actividad reciente placeholder */}
            <div className="card animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <TrendingUp size={18} color="var(--color-primary)" />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-primary-dark)",
                  }}
                >
                  Actividad reciente
                </h3>
              </div>

              <div className="empty-state" style={{ padding: "2rem" }}>
                <Calendar size={32} className="empty-state-icon" />
                <p style={{ fontSize: "0.875rem" }}>
                  Registrá movimientos para ver actividad
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
