"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CowIcon } from "@/components/icons/CowIcon";
import { CalfIcon } from "@/components/icons/CalfIcon";
import { useAuth } from "@/contexts/AuthContext";
import { getStats, getDashboardDetails } from "@/lib/api";
import type { Stats, DashboardDetails, RecentEventType } from "@/types/database";
import {
  Syringe, Leaf, Bell, BellOff,
  Clock, ShieldCheck, TrendingUp,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const dDate = new Date(d); dDate.setHours(0, 0, 0, 0);
  if (dDate.getTime() === hoy.getTime()) return "Hoy";
  if (dDate.getTime() === ayer.getTime()) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

const EVENT_COLORS: Record<RecentEventType, string> = {
  alimentacion: "#ca8a04",
  sanidad:      "#0891b2",
  costo:        "#ef4444",
  reproduccion: "#ec4899",
  destete:      "#8b5cf6",
  faena:        "#64748b",
  movimiento:   "#2563eb",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, icon: Icon, color, delay = 0, href }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; delay?: number; href?: string;
}) {
  const inner = (
    <div className="stat-card animate-fade-in" style={{ animationDelay: `${delay}ms`, cursor: href ? "pointer" : "default" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>
            {title}
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.875rem", fontWeight: 700, color: "var(--color-primary-dark)", lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>{subtitle}</p>
          )}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "0.5rem" }}>
          <Icon size={20} color="#fff" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

const ALERT_STYLES = {
  critical: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", dot: "#ef4444" },
  warning:  { bg: "#fef9c3", border: "#fde047", text: "#854d0e", dot: "#eab308" },
  info:     { bg: "#f0fdf4", border: "#86efac", text: "#166534", dot: "#22c55e" },
};

const ORANGE_STYLE = { bg: "#fff7ed", border: "#fed7aa", text: "#9a3412", dot: "#f97316" };

function AlertCard({ alert }: { alert: DashboardDetails["alerts"][0] }) {
  const isTratamiento = alert.type === "tratamiento_pendiente";
  const s = isTratamiento ? ORANGE_STYLE : ALERT_STYLES[alert.urgency];
  const isPartoIcon = alert.type === "parto_proximo";
  return (
    <Link href={alert.href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: s.bg, border: `1px solid ${s.border}`, borderRadius: "var(--radius-lg)",
          padding: "0.875rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem",
          cursor: "pointer", transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: s.dot + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {isPartoIcon ? <CalfIcon size={16} color={s.dot} /> : <Syringe size={15} color={s.dot} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: s.text, lineHeight: 1.2 }}>{alert.title}</p>
          <p style={{ fontSize: "0.75rem", color: s.text, opacity: 0.8, marginTop: "0.2rem" }}>
            {alert.detail}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Recent event row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: DashboardDetails["recentEvents"][0] }) {
  const color = EVENT_COLORS[event.type];
  const hrefMap: Record<RecentEventType, string> = {
    alimentacion: "/alimentacion", sanidad: "/sanidad", costo: "/costos",
    reproduccion: "/reproduccion", destete: "/destete", faena: "/faena", movimiento: "/movimientos",
  };
  const ACTION_ICONS: Record<string, string> = { insert: "➕", update: "✏️", delete: "🗑️" };
  const actionIcon = event.action ? (ACTION_ICONS[event.action] ?? "•") : "•";
  return (
    <Link href={hrefMap[event.type]} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: "0.35rem" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {actionIcon} {event.label}
          </p>
          {event.actor && (
            <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              👤 {event.actor}
            </p>
          )}
        </div>
        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", flexShrink: 0, fontWeight: 500, paddingTop: "0.1rem" }}>
          {formatDate(event.date)}
        </span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [details, setDetails] = useState<DashboardDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emptyStats: Stats = {
      totalActivos: 0, porEspecie: [], proximasVacunas: 0, partosEsperados: 0, costosMes: 0,
      totalAnimales: 0, totalSanidad: 0, totalAlimentacion: 0, totalReproduccion: 0,
      totalDestetes: 0, totalFaenas: 0, totalMovimientos: 0,
      alimentacionKgMes: 0, alimentacionCostoMes: 0, animalesEnRetiro: 0,
    };

    Promise.all([
      getStats().catch(() => emptyStats),
      getDashboardDetails().catch(() => ({ alerts: [], recentEvents: [] })),
    ]).then(([s, d]) => {
      setStats(s);
      setDetails(d);
      setLoading(false);
    });
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const userName = (user?.user_metadata?.nombre as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "bienvenido";

  const maxEspecie = Math.max(...(stats?.porEspecie ?? []).map((s) => s.total), 1);

  const hasAlerts = (details?.alerts.length ?? 0) > 0;
  const criticals = details?.alerts.filter((a) => a.urgency === "critical").length ?? 0;

  return (
    <div className="module-page">
      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <Leaf size={14} color="var(--color-accent)" strokeWidth={2} />
          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-accent)" }}>
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, color: "var(--color-primary-dark)", lineHeight: 1.1 }}>
          {greeting()}, {userName}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem", fontSize: "0.875rem" }}>
          Resumen de tu establecimiento al día de hoy
        </p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-bar" style={{ width: "40%", marginBottom: "1rem" }} />
              <div className="skeleton-bar" style={{ width: "60%", height: 28 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ═══ Alertas del día ═══ */}
          <div style={{ marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
              {hasAlerts
                ? <Bell size={15} color={criticals > 0 ? "#ef4444" : "#eab308"} />
                : <BellOff size={15} color="var(--color-text-muted)" />
              }
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: hasAlerts && criticals > 0 ? "#991b1b" : "var(--color-text-secondary)" }}>
                {hasAlerts
                  ? `${details!.alerts.length} alerta${details!.alerts.length !== 1 ? "s" : ""} activa${details!.alerts.length !== 1 ? "s" : ""}${criticals > 0 ? ` · ${criticals} urgente${criticals !== 1 ? "s" : ""}` : ""}`
                  : "Sin alertas — todo en orden"
                }
              </span>
            </div>

            {hasAlerts ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.625rem" }}>
                {details!.alerts.map((alert, i) => (
                  <AlertCard key={i} alert={alert} />
                ))}
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "1rem 1.25rem",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "var(--radius-lg)",
              }}>
                <ShieldCheck size={20} color="#22c55e" />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#166534" }}>Sin alertas urgentes</p>
                  <p style={{ fontSize: "0.75rem", color: "#166534", opacity: 0.75, marginTop: "0.1rem" }}>
                    No hay retiros que terminen esta semana ni partos en los próximos 14 días
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ═══ KPIs principales ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
            <KpiCard href="/animales"     title="Animales Activos" value={stats?.totalActivos ?? 0}     subtitle={`de ${stats?.totalAnimales ?? 0} totales`}       icon={CowIcon}  color="var(--color-primary)" delay={0}   />
            <KpiCard href="/sanidad"      title="En Tratamiento"        value={stats?.animalesEnRetiro ?? 0}  subtitle={`${stats?.proximasVacunas ?? 0} vacunas próximas`} icon={Syringe}  color="#0891b2"              delay={60}  />
            <KpiCard href="/reproduccion" title="Partos Próximos"  value={stats?.partosEsperados ?? 0}  subtitle="en los próximos 60 días"                          icon={CalfIcon} color="#7c3aed"              delay={120} />
          </div>

          {/* ═══ Actividad reciente ═══ */}
          <div className="card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={16} color="var(--color-primary)" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                  Actividad reciente
                </h3>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Últimos 7 días</span>
            </div>
            {details?.recentEvents && details.recentEvents.length > 0 ? (
              <div>
                {details.recentEvents.map((ev, i) => (
                  <EventRow key={i} event={ev} />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <TrendingUp size={32} className="empty-state-icon" />
                <p style={{ fontSize: "0.875rem" }}>Sin actividad en los últimos 7 días</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
