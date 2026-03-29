"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CowIcon } from "@/components/icons/CowIcon";
import { useAuth } from "@/contexts/AuthContext";
import { getStats } from "@/lib/api";
import type { Stats } from "@/types/database";
import {
  Syringe,
  DollarSign,
  Leaf,
  BarChart3,
  Wheat,
  Heart,
  Scissors,
  ArrowLeftRight,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { CalfIcon } from "@/components/icons/CalfIcon";

// ─── Stat Card ────────────────────────────────────────────────────────────────

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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.375rem" }}>
            {title}
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--color-primary-dark)", lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={22} color="#fff" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

// ─── Species Badge ─────────────────────────────────────────────────────────────

function SpeciesBadge({ especie, total }: { especie: string; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)" }} />
        <span style={{ fontSize: "0.9rem", color: "var(--color-text)" }}>{especie}</span>
      </div>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-primary-dark)" }}>
        {total}
      </span>
    </div>
  );
}

// ─── Module Link Card ──────────────────────────────────────────────────────────

function ModuleLinkCard({ href, icon: Icon, label, count, color, delay = 0 }: {
  href: string; icon: React.ElementType; label: string; count: number; color: string; delay?: number;
}) {
  return (
    <Link href={href} className="card animate-fade-in" style={{ animationDelay: `${delay}ms`, display: "flex", alignItems: "center", gap: "0.875rem", textDecoration: "none", cursor: "pointer", padding: "1rem 1.25rem" }}>
      <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} color="#fff" strokeWidth={1.75} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-primary-dark)", fontSize: "0.9375rem" }}>{label}</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          {count} {count === 1 ? "registro" : "registros"}
        </p>
      </div>
      <ChevronRight size={16} color="var(--color-text-light)" />
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {
        setStats({
          totalActivos: 0, porEspecie: [], proximasVacunas: 0, partosEsperados: 0, costosMes: 0,
          totalAnimales: 0, totalSanidad: 0, totalAlimentacion: 0, totalReproduccion: 0,
          totalDestetes: 0, totalFaenas: 0, totalMovimientos: 0,
          alimentacionKgMes: 0, alimentacionCostoMes: 0, animalesEnRetiro: 0,
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

  const formatKg = (n: number) =>
    n.toLocaleString("es-AR", { maximumFractionDigits: 0 }) + " kg";

  return (
    <div className="module-page">
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <Leaf size={16} color="var(--color-accent)" strokeWidth={2} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)" }}>
            Resumen del establecimiento
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
          {greeting()}, {(user?.user_metadata?.nombre as string | undefined) ?? user?.email ?? "bienvenido"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-bar" style={{ width: "40%", marginBottom: "1rem" }} />
              <div className="skeleton-bar" style={{ width: "60%", height: 28 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ═══ Principal Stats ═══ */}
          <div className="stagger dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            <StatCard title="Animales Activos" value={stats?.totalActivos ?? 0} subtitle={`de ${stats?.totalAnimales ?? 0} totales`} icon={CowIcon} color="var(--color-primary)" delay={0} />
            <StatCard title="Sanidad" value={stats?.animalesEnRetiro ?? 0} subtitle={`en retiro · ${stats?.totalSanidad ?? 0} tratamientos`} icon={Syringe} color="#0891b2" delay={60} />
            <StatCard title="Partos Esperados" value={stats?.partosEsperados ?? 0} subtitle={`${stats?.totalReproduccion ?? 0} servicios`} icon={CalfIcon} color="#7c3aed" delay={120} />
            <StatCard title="Costos del Mes" value={stats ? formatCurrency(stats.costosMes) : "$0"} subtitle="gastos registrados" icon={DollarSign} color="var(--color-accent)" delay={180} />
          </div>

          {/* ═══ Secondary Stats ═══ */}
          <div className="stagger dashboard-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            <StatCard title="Alimentación Mes" value={stats ? formatKg(stats.alimentacionKgMes) : "0 kg"} subtitle={`costo: ${stats ? formatCurrency(stats.alimentacionCostoMes) : "$0"}`} icon={Wheat} color="#ca8a04" delay={240} />
            <StatCard title="Próximas Vacunas" value={stats?.proximasVacunas ?? 0} subtitle="en los próximos 30 días" icon={ShieldAlert} color="#dc2626" delay={300} />
            <StatCard title="Destetes" value={stats?.totalDestetes ?? 0} subtitle="registrados" icon={Heart} color="#ec4899" delay={360} />
            <StatCard title="Faenas" value={stats?.totalFaenas ?? 0} subtitle="registradas" icon={Scissors} color="#6366f1" delay={420} />
          </div>

          {/* ═══ Bottom: Stock por especie + Módulos ═══ */}
          <div className="dashboard-bottom" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Stock por especie */}
            <div className="card animate-fade-in" style={{ animationDelay: "480ms" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <BarChart3 size={18} color="var(--color-primary)" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
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
                  <CowIcon size={32} className="empty-state-icon" />
                  <p style={{ fontSize: "0.875rem" }}>Sin datos de stock todavía</p>
                </div>
              )}
            </div>

            {/* Módulos */}
            <div className="animate-fade-in" style={{ animationDelay: "540ms" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <TrendingUp size={18} color="var(--color-primary)" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>
                  Registros por módulo
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <ModuleLinkCard href="/animales" icon={CowIcon} label="Animales" count={stats?.totalAnimales ?? 0} color="var(--color-primary)" delay={560} />
                <ModuleLinkCard href="/alimentacion" icon={Wheat} label="Alimentación" count={stats?.totalAlimentacion ?? 0} color="#ca8a04" delay={600} />
                <ModuleLinkCard href="/sanidad" icon={Syringe} label="Sanidad" count={stats?.totalSanidad ?? 0} color="#0891b2" delay={640} />
                <ModuleLinkCard href="/reproduccion" icon={Heart} label="Reproducción" count={stats?.totalReproduccion ?? 0} color="#ec4899" delay={680} />
                <ModuleLinkCard href="/movimientos" icon={ArrowLeftRight} label="Movimientos" count={stats?.totalMovimientos ?? 0} color="#2563eb" delay={720} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
