"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeftRight,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  Search,
  X,
  CalendarDays,
  PackageOpen,
  Clock,
} from "lucide-react";
import type { Movimiento, TipoMovimiento } from "@/types";
import { MovimientoModal } from "@/components/movimientos/MovimientoModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** DD/MM/YYYY → Date (noon local, para evitar off-by-one de timezone) */
function parseDMY(str: string): Date | null {
  const parts = str?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** DD/MM/YYYY → YYYY-MM-DD para comparar con inputs type="date" */
function toISO(dateStr: string): string {
  const parts = dateStr?.split("/");
  if (parts?.length !== 3) return "";
  const [d, m, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
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

function formatDateShort(dateStr: string): string {
  const d = parseDMY(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

// ─── Config por tipo ──────────────────────────────────────────────────────────

interface TipoBadgeConfig {
  label: string;
  badgeClass: string;
  icon: React.ElementType;
  iconColor: string;
  timelineDot: string;
  timelineBorder: string;
}

const TIPO_BADGE: Record<TipoMovimiento, TipoBadgeConfig> = {
  Alta: {
    label: "Alta",
    badgeClass: "badge badge-green",
    icon: ArrowUpCircle,
    iconColor: "#166534",
    timelineDot: "#22c55e",
    timelineBorder: "#dcfce7",
  },
  Baja: {
    label: "Baja",
    badgeClass: "badge badge-red",
    icon: ArrowDownCircle,
    iconColor: "#991b1b",
    timelineDot: "#ef4444",
    timelineBorder: "#fee2e2",
  },
  Traslado: {
    label: "Traslado",
    badgeClass: "badge badge-blue",
    icon: ArrowRightCircle,
    iconColor: "#1e40af",
    timelineDot: "#3b82f6",
    timelineBorder: "#dbeafe",
  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[120, 90, 70, 140, 120, 160].map((w, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <div
            style={{
              height: 14,
              width: w,
              borderRadius: 4,
              background: "linear-gradient(90deg, #e8f0e6 25%, #d4e6d1 50%, #e8f0e6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <PackageOpen size={64} />
      </div>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          color: "var(--color-primary-dark)",
          marginBottom: "0.5rem",
        }}
      >
        {filtered ? "Sin resultados" : "Sin movimientos registrados"}
      </h3>
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
        {filtered
          ? "Probá ajustando los filtros de búsqueda."
          : "Registrá el primer alta, baja o traslado del rodeo."}
      </p>
      {filtered && (
        <button
          onClick={onClear}
          className="btn btn-secondary"
          style={{ marginTop: "1rem" }}
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────

function TimelineItem({
  mov,
  isLast,
}: {
  mov: Movimiento;
  isLast: boolean;
}) {
  const cfg = TIPO_BADGE[mov.tipo];
  const Icon = cfg.icon;

  return (
    <div style={{ display: "flex", gap: "0.875rem", position: "relative" }}>
      {/* Line */}
      {!isLast && (
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 34,
            bottom: -8,
            width: 2,
            background: "var(--color-border)",
          }}
        />
      )}

      {/* Dot */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: cfg.timelineBorder,
          border: `2px solid ${cfg.timelineDot}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <Icon size={15} color={cfg.iconColor} />
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : "1.25rem", flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--color-text)",
            }}
          >
            {mov.idAnimal}
          </span>
          <span className={cfg.badgeClass}>{cfg.label}</span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-light)",
              marginLeft: "auto",
            }}
          >
            {formatDateShort(mov.fecha)}
          </span>
        </div>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
            marginTop: "2px",
          }}
        >
          {mov.motivo}
          {mov.destino ? (
            <span style={{ color: "var(--color-text-light)" }}>
              {" "}· {mov.destino}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [filterTipo, setFilterTipo] = useState<TipoMovimiento | "">("");
  const [filterAnimal, setFilterAnimal] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  // ── Fetch ──
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { getAllMovimientos } = await import("@/lib/api");
        const result = await getAllMovimientos();
        if (result.success && result.data) {
          setMovimientos(result.data);
        }
      } catch {
        // silent — la tabla mostrará vacío
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = movimientos.length;
    const altas = movimientos.filter((m) => m.tipo === "Alta").length;
    const bajas = movimientos.filter((m) => m.tipo === "Baja").length;
    const traslados = movimientos.filter((m) => m.tipo === "Traslado").length;
    return { total, altas, bajas, traslados };
  }, [movimientos]);

  // ── Filtrado ──
  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      if (filterTipo && m.tipo !== filterTipo) return false;
      if (
        filterAnimal &&
        !m.idAnimal.toLowerCase().includes(filterAnimal.toLowerCase())
      )
        return false;
      if (filterDesde) {
        const iso = toISO(m.fecha);
        if (iso < filterDesde) return false;
      }
      if (filterHasta) {
        const iso = toISO(m.fecha);
        if (iso > filterHasta) return false;
      }
      return true;
    });
  }, [movimientos, filterTipo, filterAnimal, filterDesde, filterHasta]);

  const hasFilters = !!(filterTipo || filterAnimal || filterDesde || filterHasta);

  function clearFilters() {
    setFilterTipo("");
    setFilterAnimal("");
    setFilterDesde("");
    setFilterHasta("");
  }

  // ── Últimos 10 para timeline ──
  const lastTen = useMemo(() => {
    return [...movimientos]
      .sort((a, b) => {
        const da = parseDMY(a.fecha);
        const db = parseDMY(b.fecha);
        if (!da || !db) return 0;
        return db.getTime() - da.getTime();
      })
      .slice(0, 10);
  }, [movimientos]);

  function handleSaved(record: Movimiento) {
    setMovimientos((prev) => [record, ...prev]);
    setShowModal(false);
  }

  // ── Render ──
  return (
    <>
      <div className="animate-fade-in">
        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Movimientos</h1>
            <p className="page-subtitle">
              Altas, bajas y traslados del rodeo
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Registrar Movimiento
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {/* Total */}
          <div className="stat-card animate-fade-in">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span className="label" style={{ margin: 0 }}>
                Total
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-primary-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeftRight size={18} color="var(--color-primary)" />
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : stats.total}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Movimientos registrados
            </p>
          </div>

          {/* Altas */}
          <div className="stat-card animate-fade-in">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span className="label" style={{ margin: 0 }}>
                Altas
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowUpCircle size={18} color="#166534" />
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#166534",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : stats.altas}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Ingresos al rodeo
            </p>
          </div>

          {/* Bajas */}
          <div className="stat-card animate-fade-in">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span className="label" style={{ margin: 0 }}>
                Bajas
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowDownCircle size={18} color="#991b1b" />
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#991b1b",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : stats.bajas}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Egresos del rodeo
            </p>
          </div>

          {/* Traslados */}
          <div className="stat-card animate-fade-in">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span className="label" style={{ margin: 0 }}>
                Traslados
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRightCircle size={18} color="#1e40af" />
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1e40af",
                lineHeight: 1,
              }}
            >
              {loading ? "—" : stats.traslados}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                marginTop: "0.25rem",
              }}
            >
              Movimientos internos
            </p>
          </div>
        </div>

        {/* ── Timeline + Filtros (dos columnas cuando hay datos) ── */}
        {!loading && lastTen.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 300px",
              gap: "1.5rem",
              marginBottom: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* Filtros */}
            <div
              className="card"
              style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: "var(--color-primary-dark)",
                  }}
                >
                  Filtros
                </h3>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-ghost"
                    style={{ fontSize: "0.8rem", padding: "0.25rem 0.5rem", gap: "0.25rem" }}
                  >
                    <X size={12} />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="label" htmlFor="f-tipo">
                  Tipo
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {(["", "Alta", "Baja", "Traslado"] as const).map((t) => (
                    <button
                      key={t || "todos"}
                      type="button"
                      onClick={() => setFilterTipo(t as TipoMovimiento | "")}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: 999,
                        border: `1.5px solid ${
                          filterTipo === t
                            ? "var(--color-primary)"
                            : "var(--color-border)"
                        }`,
                        background:
                          filterTipo === t
                            ? "var(--color-primary-muted)"
                            : "#fff",
                        color:
                          filterTipo === t
                            ? "var(--color-primary-dark)"
                            : "var(--color-text-muted)",
                        fontSize: "0.8125rem",
                        fontWeight: filterTipo === t ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {t || "Todos"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Búsqueda ID Animal */}
              <div>
                <label className="label" htmlFor="f-animal">
                  ID Animal
                </label>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-light)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="f-animal"
                    type="text"
                    value={filterAnimal}
                    onChange={(e) => setFilterAnimal(e.target.value)}
                    className="input"
                    placeholder="Buscar por ID..."
                    style={{ paddingLeft: "2.125rem" }}
                  />
                  {filterAnimal && (
                    <button
                      onClick={() => setFilterAnimal("")}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-light)",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Rango de fechas */}
              <div>
                <label className="label" style={{ marginBottom: "0.375rem" }}>
                  <CalendarDays
                    size={12}
                    style={{ display: "inline", marginRight: "0.3rem" }}
                  />
                  Rango de fechas
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <label
                      className="label"
                      htmlFor="f-desde"
                      style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}
                    >
                      Desde
                    </label>
                    <input
                      id="f-desde"
                      type="date"
                      value={filterDesde}
                      onChange={(e) => setFilterDesde(e.target.value)}
                      className="input"
                      style={{ fontSize: "0.8125rem" }}
                    />
                  </div>
                  <div>
                    <label
                      className="label"
                      htmlFor="f-hasta"
                      style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}
                    >
                      Hasta
                    </label>
                    <input
                      id="f-hasta"
                      type="date"
                      value={filterHasta}
                      onChange={(e) => setFilterHasta(e.target.value)}
                      className="input"
                      style={{ fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>
              </div>

              {/* Conteo de resultados */}
              {hasFilters && (
                <p
                  className="animate-fade-in"
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "0.625rem",
                    marginTop: "0.125rem",
                  }}
                >
                  {filtered.length === 0
                    ? "Sin resultados"
                    : `${filtered.length} movimiento${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <Clock size={15} color="var(--color-primary)" />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: "var(--color-primary-dark)",
                  }}
                >
                  Últimos movimientos
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {lastTen.map((mov, idx) => (
                  <TimelineItem
                    key={mov.id ?? `${mov.idAnimal}-${mov.fecha}-${idx}`}
                    mov={mov}
                    isLast={idx === lastTen.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Filtros cuando no hay datos o el layout es simple ── */}
        {!loading && lastTen.length === 0 && (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              {/* Tipo */}
              <div style={{ flex: "0 0 auto" }}>
                <label className="label">Tipo</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["", "Alta", "Baja", "Traslado"] as const).map((t) => (
                    <button
                      key={t || "todos"}
                      type="button"
                      onClick={() => setFilterTipo(t as TipoMovimiento | "")}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: 999,
                        border: `1.5px solid ${filterTipo === t ? "var(--color-primary)" : "var(--color-border)"}`,
                        background: filterTipo === t ? "var(--color-primary-muted)" : "#fff",
                        color: filterTipo === t ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                        fontSize: "0.8125rem",
                        fontWeight: filterTipo === t ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {t || "Todos"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Búsqueda animal */}
              <div style={{ flex: "1 1 180px", minWidth: 160 }}>
                <label className="label" htmlFor="f2-animal">
                  ID Animal
                </label>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-light)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="f2-animal"
                    type="text"
                    value={filterAnimal}
                    onChange={(e) => setFilterAnimal(e.target.value)}
                    className="input"
                    placeholder="Buscar..."
                    style={{ paddingLeft: "2.125rem" }}
                  />
                </div>
              </div>

              {/* Fechas */}
              <div style={{ flex: "0 0 auto" }}>
                <label className="label">Desde</label>
                <input
                  type="date"
                  value={filterDesde}
                  onChange={(e) => setFilterDesde(e.target.value)}
                  className="input"
                  style={{ width: "auto" }}
                />
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <label className="label">Hasta</label>
                <input
                  type="date"
                  value={filterHasta}
                  onChange={(e) => setFilterHasta(e.target.value)}
                  className="input"
                  style={{ width: "auto" }}
                />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost"
                  style={{ marginBottom: "1px" }}
                >
                  <X size={14} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tabla ── */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>ID Animal</th>
                <th>Tipo</th>
                <th>Motivo</th>
                <th>Destino / Procedencia</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0 }}>
                    <EmptyState
                      filtered={hasFilters}
                      onClear={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((mov, idx) => {
                  const cfg = TIPO_BADGE[mov.tipo];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={mov.id ?? `${mov.idAnimal}-${mov.fecha}-${idx}`}
                      className="animate-fade-in"
                    >
                      <td>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-text)",
                          }}
                        >
                          {formatDate(mov.fecha)}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--color-primary-dark)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {mov.idAnimal}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cfg.badgeClass}
                          style={{ display: "inline-flex", gap: "0.3rem", alignItems: "center" }}
                        >
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: "var(--color-text)",
                          }}
                        >
                          {mov.motivo || (
                            <span style={{ color: "var(--color-text-light)" }}>
                              —
                            </span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            color: mov.destino
                              ? "var(--color-text)"
                              : "var(--color-text-light)",
                          }}
                        >
                          {mov.destino || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: mov.observaciones
                              ? "var(--color-text-muted)"
                              : "var(--color-text-light)",
                            maxWidth: 200,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={mov.observaciones || undefined}
                        >
                          {mov.observaciones || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Conteo pie */}
        {!loading && filtered.length > 0 && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-light)",
              marginTop: "0.75rem",
              textAlign: "right",
            }}
          >
            {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtrados)" : ""}
          </p>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <MovimientoModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
