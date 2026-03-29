"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Calendar, Printer, RefreshCw, TrendingDown,
  TrendingUp, Wheat, Syringe, Heart, Scissors, DollarSign,
  Package, Activity,
} from "lucide-react";
import type {
  AlimentacionRow, SanidadRow, ReproduccionRow,
  DesteteRow, FaenaRow, CostoRow,
} from "@/types/database";
import {
  getAnimales, getAlimentacion, getSanidad, getReproduccion,
  getDestete, getFaena, getCostos,
} from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number) {
  return "$\u00a0" + n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatKg(n: number) {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " kg";
}

function toDate(s: string) {
  return new Date(s + "T12:00:00");
}

function inRange(dateStr: string, desde: string, hasta: string) {
  if (!dateStr) return false;
  const d = toDate(dateStr);
  if (desde && d < toDate(desde)) return false;
  if (hasta && d > toDate(hasta)) return false;
  return true;
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

interface BarData { label: string; value: number; color?: string; }

function MiniBarChart({ bars, unit = "" }: { bars: BarData[]; unit?: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {bars.map((bar) => (
        <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ width: 80, fontSize: "0.75rem", color: "var(--color-text-muted)", textAlign: "right", flexShrink: 0 }}>{bar.label}</span>
          <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(bar.value / max) * 100}%`,
                background: bar.color ?? "var(--color-primary)",
                borderRadius: 4,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ width: 72, fontSize: "0.75rem", color: "var(--color-text-secondary)", textAlign: "left", flexShrink: 0 }}>
            {bar.value > 0 ? (unit ? `${bar.value.toLocaleString("es-AR")} ${unit}` : bar.value.toLocaleString("es-AR")) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color = "var(--color-primary)", sub }: {
  icon: React.ElementType; label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "1.125rem 1.25rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.875rem",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "var(--radius-md)",
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500, marginBottom: "0.2rem" }}>{label}</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, color = "var(--color-primary)", children }: {
  title: string; icon: React.ElementType; color?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.625rem",
        padding: "0.875rem 1.25rem",
        borderBottom: "1px solid var(--color-border)",
        background: `${color}0d`,
      }}>
        <Icon size={16} color={color} />
        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>{title}</span>
      </div>
      <div style={{ padding: "1.125rem 1.25rem" }}>{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstadisticasPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfYear = `${new Date().getFullYear()}-01-01`;

  const [desde, setDesde] = useState(firstOfYear);
  const [hasta, setHasta] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [animales, setAnimales] = useState<Awaited<ReturnType<typeof getAnimales>>>([]);
  const [alimentacion, setAlimentacion] = useState<AlimentacionRow[]>([]);
  const [sanidad, setSanidad] = useState<SanidadRow[]>([]);
  const [reproduccion, setReproduccion] = useState<ReproduccionRow[]>([]);
  const [destete, setDestete] = useState<DesteteRow[]>([]);
  const [faena, setFaena] = useState<FaenaRow[]>([]);
  const [costos, setCostos] = useState<CostoRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getAnimales(),
      getAlimentacion(),
      getSanidad(),
      getReproduccion(),
      getDestete(),
      getFaena(),
      getCostos(),
    ])
      .then(([a, al, sa, re, de, fa, co]) => {
        if (cancelled) return;
        setAnimales(a);
        setAlimentacion(al);
        setSanidad(sa);
        setReproduccion(re);
        setDestete(de);
        setFaena(fa);
        setCostos(co);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? "Error al cargar datos");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Filtered data ────────────────────────────────────────────────────────────

  const filtAlim  = useMemo(() => alimentacion.filter((r) => inRange(r.fecha, desde, hasta)), [alimentacion, desde, hasta]);
  const filtSan   = useMemo(() => sanidad.filter((r) => inRange(r.fecha, desde, hasta)), [sanidad, desde, hasta]);
  const filtRepro = useMemo(() => reproduccion.filter((r) => inRange(r.fecha_servicio ?? r.fecha_parto ?? "", desde, hasta)), [reproduccion, desde, hasta]);
  const filtDes   = useMemo(() => destete.filter((r) => inRange(r.fecha, desde, hasta)), [destete, desde, hasta]);
  const filtFaena = useMemo(() => faena.filter((r) => inRange(r.fecha, desde, hasta)), [faena, desde, hasta]);
  const filtCostos= useMemo(() => costos.filter((r) => inRange(r.fecha, desde, hasta)), [costos, desde, hasta]);

  // ── Computed stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    // Animales
    const totalAnimales = animales.length;
    const activos = animales.filter((a) => a.estado === "Activo").length;
    const porEspecie = animales.reduce<Record<string, number>>((acc, a) => {
      acc[a.especie] = (acc[a.especie] ?? 0) + 1;
      return acc;
    }, {});

    // Alimentación
    const totalKgAlim = filtAlim.reduce((s, r) => s + (r.total_kg ?? 0), 0);
    const totalCostoAlim = filtAlim.reduce((s, r) => s + (r.costo_total ?? 0), 0);
    const porTipoAlim = filtAlim.reduce<Record<string, number>>((acc, r) => {
      const t = r.racion ?? "Sin ración";
      acc[t] = (acc[t] ?? 0) + (r.total_kg ?? 0);
      return acc;
    }, {});

    // Sanidad
    const porTipoSan = filtSan.reduce<Record<string, number>>((acc, r) => {
      const t = r.tipo ?? "Otro";
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

    // Reproducción — "preñadas" = fecha_servicio registrada pero sin parto aún
    const preñadas = filtRepro.filter((r) => !r.fecha_parto).length;
    const partos   = filtRepro.filter((r) => !!r.fecha_parto).length;

    // Destete
    const totalDestetes = filtDes.length;
    const avgPesoDestete = filtDes.length
      ? filtDes.reduce((s, r) => s + (r.peso_promedio ?? 0), 0) / filtDes.filter((r) => r.peso_promedio).length
      : 0;

    // Faena
    const totalFaena = filtFaena.length;
    const kgFaena = filtFaena.reduce((s, r) => s + (r.peso_canal ?? 0), 0);

    // Costos
    const totalCostos = filtCostos.reduce((s, r) => s + (r.monto ?? 0), 0);
    const porCategoriaCosto = filtCostos.reduce<Record<string, number>>((acc, r) => {
      const c = r.categoria ?? "Sin categoría";
      acc[c] = (acc[c] ?? 0) + (r.monto ?? 0);
      return acc;
    }, {});

    return {
      totalAnimales, activos, porEspecie,
      totalKgAlim, totalCostoAlim, porTipoAlim,
      porTipoSan, preñadas, partos,
      totalDestetes, avgPesoDestete,
      totalFaena, kgFaena,
      totalCostos, porCategoriaCosto,
    };
  }, [animales, filtAlim, filtSan, filtRepro, filtDes, filtFaena, filtCostos]);

  // ── Build bar data helpers ────────────────────────────────────────────────────

  const especieBars: BarData[] = Object.entries(stats.porEspecie)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  const tipoAlimBars: BarData[] = Object.entries(stats.porTipoAlim)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: "var(--color-warning)" }));

  const sanidadBars: BarData[] = Object.entries(stats.porTipoSan)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: "#f59e0b" }));

  const costoBars: BarData[] = Object.entries(stats.porCategoriaCosto)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: "#ef4444" }));

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="module-page animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-subtitle">Resumen agregado de todos los módulos</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => window.print()} title="Imprimir reporte">
            <Printer size={16} />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Date filter */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
        padding: "0.875rem 1.125rem",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "1.5rem",
      }}>
        <Calendar size={16} color="var(--color-text-muted)" />
        <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Período:</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="date"
            className="form-input"
            style={{ padding: "0.35rem 0.6rem", fontSize: "0.8125rem", width: "auto" }}
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>hasta</span>
          <input
            type="date"
            className="form-input"
            style={{ padding: "0.35rem 0.6rem", fontSize: "0.8125rem", width: "auto" }}
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-muted)" }}>
          <RefreshCw size={28} style={{ animation: "spin 0.8s linear infinite", marginBottom: "0.5rem" }} />
          <p style={{ fontSize: "0.875rem" }}>Cargando datos...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {!loading && error && (
        <div style={{ padding: "1.5rem", background: "#fee2e2", borderRadius: "var(--radius-md)", color: "#991b1b", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
            <KpiCard icon={Activity} label="Animales activos" value={String(stats.activos)} sub={`de ${stats.totalAnimales} totales`} />
            <KpiCard icon={Wheat} label="Alimento consumido" value={formatKg(stats.totalKgAlim)} sub="en el período" color="var(--color-warning)" />
            <KpiCard icon={Syringe} label="Eventos sanidad" value={String(filtSan.length)} sub="aplicaciones / tratamientos" color="#f59e0b" />
            <KpiCard icon={Heart} label="Partos registrados" value={String(stats.partos)} sub={`${stats.preñadas} preñadas activas`} color="#ec4899" />
            <KpiCard icon={Package} label="Destetes" value={String(stats.totalDestetes)} sub={stats.avgPesoDestete > 0 ? `Prom. ${formatKg(stats.avgPesoDestete)}` : undefined} color="#8b5cf6" />
            <KpiCard icon={Scissors} label="Animales faenados" value={String(stats.totalFaena)} sub={stats.kgFaena > 0 ? formatKg(stats.kgFaena) + " en vara" : undefined} color="#64748b" />
            <KpiCard icon={DollarSign} label="Gastos totales" value={formatMoney(stats.totalCostos + stats.totalCostoAlim)} sub="costos + alimentación" color="#ef4444" />
          </div>

          {/* Charts grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>

            {/* Animales por especie */}
            <Section title="Animales por especie" icon={Activity}>
              {especieBars.length === 0
                ? <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Sin datos</p>
                : <MiniBarChart bars={especieBars} unit="animales" />
              }
            </Section>

            {/* Alimentación por tipo */}
            <Section title="Alimentación por tipo" icon={Wheat} color="var(--color-warning)">
              {tipoAlimBars.length === 0
                ? <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Sin registros en el período</p>
                : <MiniBarChart bars={tipoAlimBars} unit="kg" />
              }
              {stats.totalKgAlim > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Total consumido</span>
                  <span style={{ fontWeight: 600 }}>{formatKg(stats.totalKgAlim)}</span>
                </div>
              )}
              {stats.totalCostoAlim > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Costo alimento</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(stats.totalCostoAlim)}</span>
                </div>
              )}
            </Section>

            {/* Sanidad por tipo de evento */}
            <Section title="Sanidad por tipo de evento" icon={Syringe} color="#f59e0b">
              {sanidadBars.length === 0
                ? <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Sin eventos en el período</p>
                : <MiniBarChart bars={sanidadBars} />
              }
            </Section>

            {/* Costos por categoría */}
            <Section title="Costos por categoría" icon={DollarSign} color="#ef4444">
              {costoBars.length === 0
                ? <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Sin costos en el período</p>
                : <MiniBarChart bars={costoBars.map((b) => ({ ...b, label: b.label, value: b.value }))} unit="$" />
              }
              {stats.totalCostos > 0 && (
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Total costos</span>
                  <span style={{ fontWeight: 600 }}>{formatMoney(stats.totalCostos)}</span>
                </div>
              )}
            </Section>

            {/* Reproducción */}
            <Section title="Reproducción" icon={Heart} color="#ec4899">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  { label: "Servicios / preñeces", value: filtRepro.length },
                  { label: "Preñadas (activas)",   value: stats.preñadas },
                  { label: "Partos en período",    value: stats.partos },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.25rem 0" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Faena y destete */}
            <Section title="Faena & Destete" icon={Scissors} color="#64748b">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  { label: "Destetes",              value: `${stats.totalDestetes} animales` },
                  { label: "Peso prom. destete",    value: stats.avgPesoDestete > 0 ? formatKg(stats.avgPesoDestete) : "—" },
                  { label: "Animales faenados",     value: `${stats.totalFaena}` },
                  { label: "Kg en vara (faena)",    value: stats.kgFaena > 0 ? formatKg(stats.kgFaena) : "—" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.25rem 0" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Section>

          </div>
        </>
      )}
    </div>
  );
}
