"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Plus,
  Building2,
  TrendingUp,
  BarChart3,
  Filter,
  X,
  PackageOpen,
  ChevronDown,
  Layers,
} from "lucide-react";
import type { Costo, TipoCosto } from "@/types";
import { CostoModal } from "@/components/costos/CostoModal";

// ─── Constants ────────────────────────────────────────────────────────────────

type Periodo = "mes" | "trimestre" | "año" | "personalizado";

const PERIODO_LABELS: Record<Periodo, string> = {
  mes: "Mes actual",
  trimestre: "Trimestre",
  año: "Año",
  personalizado: "Personalizado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** DD/MM/YYYY → Date (noon local) */
function parseDMY(str: string): Date | null {
  const parts = str?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatDate(dateStr: string): string {
  const d = parseDMY(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Retorna [desde, hasta] para el período seleccionado */
function getPeriodRange(periodo: Periodo, desde: string, hasta: string): [Date, Date] {
  const now = new Date();
  if (periodo === "mes") {
    return [
      new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0),
      new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    ];
  }
  if (periodo === "trimestre") {
    const q = Math.floor(now.getMonth() / 3);
    return [
      new Date(now.getFullYear(), q * 3, 1, 0, 0, 0),
      new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59),
    ];
  }
  if (periodo === "año") {
    return [
      new Date(now.getFullYear(), 0, 1, 0, 0, 0),
      new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    ];
  }
  // personalizado
  const d1 = desde ? new Date(desde + "T00:00:00") : new Date(now.getFullYear(), 0, 1);
  const d2 = hasta ? new Date(hasta + "T23:59:59") : now;
  return [d1, d2];
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function firstOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <div
            style={{
              height: 13,
              borderRadius: 4,
              background:
                "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
              width: i === 0 ? "55%" : i === cols - 1 ? "70%" : "60%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  loading?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accentColor,
  bgColor,
  loading,
}: StatCardProps) {
  return (
    <div className="stat-card" style={{ overflow: "hidden", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            {label}
          </p>
          {loading ? (
            <div
              style={{
                height: 28,
                width: "65%",
                borderRadius: 4,
                background:
                  "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }}
            />
          ) : (
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.625rem",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
                lineHeight: 1.1,
              }}
            >
              {value}
            </p>
          )}
          {sub && !loading && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-light)",
                marginTop: "0.25rem",
              }}
            >
              {sub}
            </p>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-lg)",
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CostosPage() {
  const [costos, setCostos] = useState<Costo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Período
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desde, setDesde] = useState(firstOfYearISO());
  const [hasta, setHasta] = useState(todayISO());

  // Filtros tabla
  const [filterTipo, setFilterTipo] = useState<"" | TipoCosto>("");
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Load ──

  const loadCostos = useCallback(async () => {
    setLoading(true);
    try {
      const { getAllCostos } = await import("@/lib/api");
      const res = await getAllCostos();
      if (res.success && res.data) {
        setCostos(res.data);
      }
    } catch {
      // silencioso — mostrar vacío
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCostos();
  }, [loadCostos]);

  // ── Período filtered ──

  const costosPeriodo = useMemo(() => {
    const [rangeStart, rangeEnd] = getPeriodRange(periodo, desde, hasta);
    return costos.filter((c) => {
      const d = parseDMY(c.fecha);
      if (!d) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [costos, periodo, desde, hasta]);

  // ── Stats ──

  const stats = useMemo(() => {
    const total = costosPeriodo.reduce((s, c) => s + c.monto, 0);
    const fijos = costosPeriodo
      .filter((c) => c.tipo === "Fijo")
      .reduce((s, c) => s + c.monto, 0);
    const variables = costosPeriodo
      .filter((c) => c.tipo === "Variable")
      .reduce((s, c) => s + c.monto, 0);

    // Costo promedio por especie (distintas)
    const especieMap = new Map<string, number>();
    costosPeriodo.forEach((c) => {
      const esp = c.especie || "General";
      especieMap.set(esp, (especieMap.get(esp) ?? 0) + c.monto);
    });
    const numEspecies = especieMap.size || 1;
    const promPorEspecie = total / numEspecies;

    const pctFijo = total > 0 ? (fijos / total) * 100 : 0;
    const pctVariable = total > 0 ? (variables / total) * 100 : 0;

    return { total, fijos, variables, promPorEspecie, pctFijo, pctVariable, numEspecies };
  }, [costosPeriodo]);

  // ── Breakdown por categoría ──

  const categoriaBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    costosPeriodo.forEach((c) => {
      map.set(c.categoria, (map.get(c.categoria) ?? 0) + c.monto);
    });
    return Array.from(map.entries())
      .map(([cat, monto]) => ({ cat, monto }))
      .sort((a, b) => b.monto - a.monto);
  }, [costosPeriodo]);

  // ── Especies para filtro ──

  const especiesDisponibles = useMemo(() => {
    return Array.from(new Set(costos.map((c) => c.especie || "General"))).sort();
  }, [costos]);

  const categoriasDisponibles = useMemo(() => {
    return Array.from(new Set(costos.map((c) => c.categoria))).sort();
  }, [costos]);

  // ── Tabla filtrada ──

  const costosFiltrados = useMemo(() => {
    return costos.filter((c) => {
      if (filterTipo && c.tipo !== filterTipo) return false;
      if (filterEspecie && (c.especie || "General") !== filterEspecie) return false;
      if (filterCategoria && c.categoria !== filterCategoria) return false;
      if (filterDesde) {
        const d = parseDMY(c.fecha);
        if (!d || d < new Date(filterDesde + "T00:00:00")) return false;
      }
      if (filterHasta) {
        const d = parseDMY(c.fecha);
        if (!d || d > new Date(filterHasta + "T23:59:59")) return false;
      }
      return true;
    });
  }, [costos, filterTipo, filterEspecie, filterCategoria, filterDesde, filterHasta]);

  const activeFilters =
    [filterTipo, filterEspecie, filterCategoria, filterDesde, filterHasta].filter(Boolean).length;

  function clearFilters() {
    setFilterTipo("");
    setFilterEspecie("");
    setFilterCategoria("");
    setFilterDesde("");
    setFilterHasta("");
  }

  // ── Saved ──

  function handleSaved(record: Costo) {
    setCostos((prev) => [record, ...prev]);
    setShowModal(false);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <DollarSign
              size={28}
              style={{ color: "var(--color-accent)", flexShrink: 0 }}
            />
            Análisis de Costos
          </h1>
          <p className="page-subtitle">
            Seguimiento económico del establecimiento por período, categoría y especie
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{
            background: "var(--color-accent)",
            gap: "0.375rem",
          }}
        >
          <Plus size={16} />
          Registrar costo
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECCIÓN 1: Resumen del período ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      <section style={{ marginBottom: "2rem" }}>
        {/* Selector de período */}
        <div
          className="card"
          style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-text-muted)",
                marginRight: "0.25rem",
              }}
            >
              Período:
            </span>
            {(Object.keys(PERIODO_LABELS) as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: 999,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  border: "1.5px solid",
                  borderColor: periodo === p ? "var(--color-accent)" : "var(--color-border)",
                  background: periodo === p ? "var(--color-accent-muted)" : "transparent",
                  color: periodo === p ? "var(--color-accent)" : "var(--color-text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {PERIODO_LABELS[p]}
              </button>
            ))}

            {periodo === "personalizado" && (
              <div
                className="animate-fade-in"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "0.5rem" }}
              >
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="input"
                  style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
                />
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>→</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="input"
                  style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <StatCard
            label="Costo Total"
            value={`$ ${formatMoney(stats.total)}`}
            sub={`${costosPeriodo.length} registro${costosPeriodo.length !== 1 ? "s" : ""}`}
            icon={<DollarSign size={22} color="var(--color-accent)" />}
            accentColor="var(--color-accent)"
            bgColor="var(--color-accent-muted)"
            loading={loading}
          />
          <StatCard
            label="Costos Fijos"
            value={`$ ${formatMoney(stats.fijos)}`}
            sub={`${stats.pctFijo.toFixed(1)}% del total`}
            icon={<Building2 size={22} color="#1e40af" />}
            accentColor="#3b82f6"
            bgColor="#dbeafe"
            loading={loading}
          />
          <StatCard
            label="Costos Variables"
            value={`$ ${formatMoney(stats.variables)}`}
            sub={`${stats.pctVariable.toFixed(1)}% del total`}
            icon={<TrendingUp size={22} color="#c2410c" />}
            accentColor="#f97316"
            bgColor="#ffedd5"
            loading={loading}
          />
          <StatCard
            label="Prom. por Especie"
            value={`$ ${formatMoney(stats.promPorEspecie)}`}
            sub={`${stats.numEspecies} especie${stats.numEspecies !== 1 ? "s" : ""} con costos`}
            icon={<BarChart3 size={22} color="var(--color-primary)" />}
            accentColor="var(--color-primary)"
            bgColor="var(--color-primary-muted)"
            loading={loading}
          />
        </div>

        {/* Barra Fijo vs Variable */}
        {!loading && stats.total > 0 && (
          <div
            className="card animate-fade-in"
            style={{ padding: "1rem 1.25rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.625rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-text-muted)",
                }}
              >
                Proporción Fijo / Variable
              </p>
              <div style={{ display: "flex", gap: "1.25rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 600 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      marginRight: "0.375rem",
                    }}
                  />
                  Fijo {stats.pctFijo.toFixed(1)}%
                </span>
                <span style={{ fontSize: "0.8rem", color: "#c2410c", fontWeight: 600 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#f97316",
                      marginRight: "0.375rem",
                    }}
                  />
                  Variable {stats.pctVariable.toFixed(1)}%
                </span>
              </div>
            </div>
            <div
              style={{
                height: 12,
                borderRadius: 999,
                overflow: "hidden",
                background: "var(--color-border)",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${stats.pctFijo}%`,
                  background: "linear-gradient(90deg, #1e40af, #3b82f6)",
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              <div
                style={{
                  width: `${stats.pctVariable}%`,
                  background: "linear-gradient(90deg, #f97316, #fb923c)",
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECCIÓN 2: Breakdown por categoría ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {!loading && categoriaBreakdown.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.25rem",
              }}
            >
              <Layers size={18} style={{ color: "var(--color-accent)" }} />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                }}
              >
                Breakdown por categoría
              </h2>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  color: "var(--color-text-light)",
                }}
              >
                {PERIODO_LABELS[periodo]}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {categoriaBreakdown.map(({ cat, monto }, idx) => {
                const pct = stats.total > 0 ? (monto / stats.total) * 100 : 0;
                // Colores distintos por posición
                const palette = [
                  { bar: "var(--color-accent)", bg: "var(--color-accent-muted)", text: "var(--color-accent)" },
                  { bar: "var(--color-primary)", bg: "var(--color-primary-muted)", text: "var(--color-primary)" },
                  { bar: "#3b82f6", bg: "#dbeafe", text: "#1e40af" },
                  { bar: "#f97316", bg: "#ffedd5", text: "#c2410c" },
                  { bar: "#8b5cf6", bg: "#ede9fe", text: "#6d28d9" },
                  { bar: "#10b981", bg: "#d1fae5", text: "#065f46" },
                  { bar: "#ec4899", bg: "#fce7f3", text: "#9d174d" },
                ];
                const color = palette[idx % palette.length];

                return (
                  <div key={cat} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.375rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: color.bar,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            color: "var(--color-text)",
                          }}
                        >
                          {cat}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: color.text,
                            minWidth: 80,
                            textAlign: "right",
                          }}
                        >
                          $ {formatMoney(monto)}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: color.bg,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: color.bar,
                          borderRadius: 999,
                          transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Loading breakdown skeleton */}
      {loading && (
        <section style={{ marginBottom: "2rem" }}>
          <div className="card">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[85, 60, 45, 30].map((w, i) => (
                <div key={i}>
                  <div
                    style={{
                      height: 13,
                      width: `${w}%`,
                      borderRadius: 4,
                      background:
                        "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.4s infinite",
                      marginBottom: "0.5rem",
                    }}
                  />
                  <div
                    style={{
                      height: 8,
                      width: `${w}%`,
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.4s infinite",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECCIÓN 3: Historial detallado ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      <section>
        {/* Header + Filtros */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.875rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
            }}
          >
            Historial completo
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="btn btn-ghost"
                style={{ fontSize: "0.8rem", color: "var(--color-error)", gap: "0.25rem" }}
              >
                <X size={13} />
                Limpiar ({activeFilters})
              </button>
            )}
            <button
              onClick={() => setFiltersOpen((p) => !p)}
              className="btn btn-secondary"
              style={{ gap: "0.375rem", fontSize: "0.85rem" }}
            >
              <Filter size={14} />
              Filtros
              {activeFilters > 0 && (
                <span
                  style={{
                    background: "var(--color-accent)",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "0 0.4rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    lineHeight: "1.4",
                  }}
                >
                  {activeFilters}
                </span>
              )}
              <ChevronDown
                size={13}
                style={{
                  transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {filtersOpen && (
          <div
            className="card animate-fade-in"
            style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {/* Tipo */}
              <div>
                <label className="label" htmlFor="f-tipo">Tipo</label>
                <select
                  id="f-tipo"
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value as "" | TipoCosto)}
                  className="input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Todos</option>
                  <option value="Fijo">Fijo</option>
                  <option value="Variable">Variable</option>
                </select>
              </div>

              {/* Especie */}
              <div>
                <label className="label" htmlFor="f-especie">Especie</label>
                <select
                  id="f-especie"
                  value={filterEspecie}
                  onChange={(e) => setFilterEspecie(e.target.value)}
                  className="input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Todas</option>
                  {especiesDisponibles.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="label" htmlFor="f-cat">Categoría</label>
                <select
                  id="f-cat"
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Todas</option>
                  {categoriasDisponibles.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Desde */}
              <div>
                <label className="label" htmlFor="f-desde">Desde</label>
                <input
                  id="f-desde"
                  type="date"
                  value={filterDesde}
                  onChange={(e) => setFilterDesde(e.target.value)}
                  className="input"
                />
              </div>

              {/* Hasta */}
              <div>
                <label className="label" htmlFor="f-hasta">Hasta</label>
                <input
                  id="f-hasta"
                  type="date"
                  value={filterHasta}
                  onChange={(e) => setFilterHasta(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Concepto</th>
                <th>Especie</th>
                <th style={{ textAlign: "right" }}>Monto</th>
                <th style={{ textAlign: "center" }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                : costosFiltrados.length === 0
                ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state" style={{ padding: "3rem 2rem" }}>
                        <PackageOpen className="empty-state-icon" />
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "var(--color-primary-dark)",
                            marginBottom: "0.375rem",
                          }}
                        >
                          Sin registros
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "var(--color-text-light)" }}>
                          {activeFilters > 0
                            ? "Ningún costo coincide con los filtros aplicados."
                            : "Registrá el primer costo del establecimiento."}
                        </p>
                        {activeFilters === 0 && (
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowModal(true)}
                            style={{
                              marginTop: "1rem",
                              background: "var(--color-accent)",
                              gap: "0.375rem",
                            }}
                          >
                            <Plus size={15} />
                            Registrar costo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
                : costosFiltrados.map((c, i) => (
                  <tr key={c.id ?? i} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                      {formatDate(c.fecha)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 500,
                          color: "var(--color-text)",
                        }}
                      >
                        {c.categoria}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                      {c.concepto}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "var(--color-primary-muted)",
                          color: "var(--color-primary-dark)",
                          borderRadius: 999,
                          padding: "0.15rem 0.6rem",
                          fontWeight: 500,
                        }}
                      >
                        {c.especie || "General"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: "var(--color-accent)",
                        }}
                      >
                        $ {formatMoney(c.monto)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {c.tipo === "Fijo" ? (
                        <span className="badge badge-blue" style={{ gap: "0.3rem" }}>
                          <Building2 size={11} />
                          Fijo
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{
                            background: "#ffedd5",
                            color: "#c2410c",
                            gap: "0.3rem",
                          }}
                        >
                          <TrendingUp size={11} />
                          Variable
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Footer tabla */}
        {!loading && costosFiltrados.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.625rem 0.25rem",
              marginTop: "0.5rem",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-light)" }}>
              {costosFiltrados.length} registro{costosFiltrados.length !== 1 ? "s" : ""}
              {activeFilters > 0 ? " (filtrado)" : ""}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                fontFamily: "var(--font-display)",
              }}
            >
              Total: $ {formatMoney(costosFiltrados.reduce((s, c) => s + c.monto, 0))}
            </p>
          </div>
        )}
      </section>

      {/* ── Modal ── */}
      {showModal && (
        <CostoModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}

      {/* ── Shimmer keyframe (global via style tag) ── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
