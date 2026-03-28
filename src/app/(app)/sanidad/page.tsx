"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Syringe,
  Plus,
  Filter,
  X,
  AlertTriangle,
  CheckCircle2,
  PackageOpen,
  ShieldAlert,
  CalendarDays,
  ChevronDown,
  Clock,
} from "lucide-react";
import type { Sanidad } from "@/types";
import { SanidadModal } from "@/components/sanidad/SanidadModal";

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

/** Retorna los días restantes de retiro (>=0) o null si no aplica / ya expiró */
function diasRetiroRestantes(
  fechaStr: string,
  diasRetiro: number
): number | null {
  if (!diasRetiro || diasRetiro <= 0) return null;
  const base = parseDMY(fechaStr);
  if (!base) return null;
  const fin = new Date(base);
  fin.setDate(fin.getDate() + diasRetiro);
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const diff = Math.ceil(
    (fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? diff : null;
}

/** Fecha fin de retiro como string legible */
function fechaFinRetiro(fechaStr: string, diasRetiro: number): string {
  const base = parseDMY(fechaStr);
  if (!base) return "";
  const fin = new Date(base);
  fin.setDate(fin.getDate() + diasRetiro);
  return fin.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
              width: i === 0 ? "55%" : i === cols - 1 ? "80%" : "65%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Alerta Card (animal en retiro) ──────────────────────────────────────────

interface AlertaCardProps {
  registro: Sanidad;
  restantes: number;
}

function AlertaCard({ registro, restantes }: AlertaCardProps) {
  const urgente = restantes <= 3;
  return (
    <div
      className="animate-fade-in"
      style={{
        background: urgente
          ? "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)"
          : "linear-gradient(135deg, #fffbeb 0%, #fef9ee 100%)",
        border: urgente ? "1.5px solid #f59e0b" : "1.5px solid #fcd34d",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Franja izquierda de urgencia */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: urgente ? "#f59e0b" : "#fcd34d",
          borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
        }}
      />

      {/* Icono */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "var(--radius-md)",
          background: urgente ? "#fef3c7" : "#fef9ee",
          border: `1px solid ${urgente ? "#f59e0b" : "#fde68a"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={20} color={urgente ? "#b45309" : "#92400e"} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 160 }}>
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
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#78350f",
            }}
          >
            {registro.idAnimal}
          </span>
          <span className="badge badge-amber" style={{ fontSize: "0.7rem" }}>
            {registro.especie}
          </span>
          {/* Badge "No faenar" prominente */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "#dc2626",
              color: "#fff",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            <ShieldAlert size={11} />
            No faenar
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#92400e", marginTop: "0.25rem" }}>
          <strong>{registro.producto}</strong> · {registro.tratamiento}
        </p>
      </div>

      {/* Contador de días */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.125rem",
          flexShrink: 0,
          minWidth: 80,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            fontWeight: 700,
            color: urgente ? "#b45309" : "#92400e",
            lineHeight: 1,
          }}
        >
          {restantes}
        </span>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#92400e",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {restantes === 1 ? "día" : "días"}
        </span>
        <span style={{ fontSize: "0.7rem", color: "#a16207" }}>restantes</span>
      </div>

      {/* Fecha fin */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          flexShrink: 0,
          minWidth: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <CalendarDays size={12} color="#92400e" />
          <span style={{ fontSize: "0.75rem", color: "#78350f", fontWeight: 600 }}>
            Libre el
          </span>
        </div>
        <span
          style={{
            fontSize: "0.8125rem",
            color: "#78350f",
            fontWeight: 700,
            marginTop: "2px",
          }}
        >
          {fechaFinRetiro(registro.fecha, registro.diasRetiro)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SanidadPage() {
  const [records, setRecords] = useState<Sanidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterAnimal, setFilterAnimal] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  // ── Load ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getAllSanidad } = await import("@/lib/api");
        const res = await getAllSanidad();
        if (cancelled) return;
        if (!res.success) throw new Error(res.error ?? "Error al cargar datos.");
        setRecords(res.data ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Computed: animales en retiro activo, ordenados por urgencia ──
  const enRetiro = useMemo(() => {
    return records
      .map((r) => ({
        registro: r,
        restantes: diasRetiroRestantes(r.fecha, r.diasRetiro),
      }))
      .filter((x) => x.restantes !== null)
      .sort((a, b) => (a.restantes ?? 0) - (b.restantes ?? 0)) as Array<{
      registro: Sanidad;
      restantes: number;
    }>;
  }, [records]);

  // ── Opciones únicas para filtros ──
  const especieOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.especie).filter(Boolean))).sort(),
    [records]
  );
  const tipoOptions = useMemo(
    () =>
      Array.from(new Set(records.map((r) => r.tipo).filter(Boolean))).sort(),
    [records]
  );

  // ── Filtrado del historial ──
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie && r.especie !== filterEspecie) return false;
      if (
        filterAnimal &&
        !r.idAnimal.toLowerCase().includes(filterAnimal.toLowerCase())
      )
        return false;
      if (filterTipo && r.tipo !== filterTipo) return false;
      if (filterDesde || filterHasta) {
        const iso = toISO(r.fecha);
        if (filterDesde && iso < filterDesde) return false;
        if (filterHasta && iso > filterHasta) return false;
      }
      return true;
    });
  }, [records, filterEspecie, filterAnimal, filterTipo, filterDesde, filterHasta]);

  const hasFilters = !!(
    filterEspecie ||
    filterAnimal ||
    filterTipo ||
    filterDesde ||
    filterHasta
  );

  function clearFilters() {
    setFilterEspecie("");
    setFilterAnimal("");
    setFilterTipo("");
    setFilterDesde("");
    setFilterHasta("");
  }

  function handleSaved(record: Sanidad) {
    setRecords((prev) => [record, ...prev]);
    setShowModal(false);
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-warn {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
      `}</style>

      <div
        style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }}
        className="animate-fade-in"
      >
        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "0.25rem",
              }}
            >
              <div
                style={{
                  background: "var(--color-primary-muted)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.375rem",
                  display: "flex",
                  color: "var(--color-primary)",
                }}
              >
                <Syringe size={20} />
              </div>
              <h1 className="page-title">Sanidad</h1>
            </div>
            <p className="page-subtitle">
              Control de tratamientos, vacunaciones y períodos de retiro por
              animal
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowFilters((v) => !v)}
              style={{ position: "relative" }}
            >
              <Filter size={15} />
              Filtros
              {hasFilters && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                  }}
                />
              )}
              <ChevronDown
                size={14}
                style={{
                  transition: "transform 0.2s",
                  transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Nuevo Tratamiento
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 1 — ALERTAS DE RETIRO (feature principal)
        ════════════════════════════════════════════════════════════════════ */}
        {!loading && !error && (
          <section className="animate-fade-in" style={{ marginBottom: "2rem" }}>
            {/* Header del panel de alertas */}
            <div
              style={{
                background:
                  enRetiro.length > 0
                    ? "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)"
                    : "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
                borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
                padding: "1rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.5rem",
                    display: "flex",
                    animation:
                      enRetiro.length > 0
                        ? "pulse-warn 2.5s ease-in-out infinite"
                        : "none",
                  }}
                >
                  {enRetiro.length > 0 ? (
                    <ShieldAlert size={22} color="#fff" />
                  ) : (
                    <CheckCircle2 size={22} color="#fff" />
                  )}
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.125rem",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "2px",
                    }}
                  >
                    Alertas de Período de Retiro
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.72)" }}>
                    Animales que NO pueden ser faenados hasta completar su
                    tratamiento
                  </p>
                </div>
              </div>

              {/* Contador de animales en retiro */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.5rem 1rem",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {enRetiro.length}
                </span>
                <div>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.85)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      lineHeight: 1.1,
                    }}
                  >
                    {enRetiro.length === 1 ? "animal" : "animales"}
                  </p>
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.65)",
                      lineHeight: 1.1,
                    }}
                  >
                    en retiro
                  </p>
                </div>
              </div>
            </div>

            {/* Cuerpo del panel */}
            <div
              style={{
                background: enRetiro.length > 0 ? "#fffbeb" : "var(--color-bg-card)",
                border:
                  enRetiro.length > 0
                    ? "1.5px solid #fde68a"
                    : "1.5px solid var(--color-border)",
                borderTop: "none",
                borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {enRetiro.length === 0 ? (
                /* Sin animales en retiro */
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 0",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={24} color="#16a34a" />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "var(--color-primary-dark)",
                        marginBottom: "2px",
                      }}
                    >
                      Sin animales en período de retiro
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Todos los animales están habilitados para faena. Buen
                      trabajo.
                    </p>
                  </div>
                </div>
              ) : (
                /* Grid de tarjetas — ordenadas por urgencia (menos días primero) */
                <div
                  className="stagger"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
                    gap: "0.75rem",
                  }}
                >
                  {enRetiro.map(({ registro, restantes }) => (
                    <AlertaCard
                      key={
                        registro.id ??
                        `${registro.idAnimal}-${registro.fecha}`
                      }
                      registro={registro}
                      restantes={restantes}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Error global ── */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem 1.5rem",
              color: "var(--color-error)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <X size={18} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.9375rem" }}>{error}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECCIÓN 2 — HISTORIAL DE TRATAMIENTOS
        ════════════════════════════════════════════════════════════════════ */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              gap: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <Clock size={17} style={{ color: "var(--color-primary)" }} />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                }}
              >
                Historial de tratamientos
              </h2>
              {!loading && !error && (
                <span
                  style={{
                    background: "var(--color-primary-muted)",
                    color: "var(--color-primary-dark)",
                    borderRadius: "999px",
                    padding: "0.15rem 0.6rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {filtered.length}
                  {hasFilters && ` / ${records.length}`}
                </span>
              )}
            </div>
          </div>

          {/* ── Panel de filtros ── */}
          {showFilters && (
            <div
              className="card animate-fade-in"
              style={{ marginBottom: "1.25rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Filtros activos
                </p>
                {hasFilters && (
                  <button
                    className="btn btn-ghost"
                    onClick={clearFilters}
                    style={{ fontSize: "0.8125rem", padding: "0.25rem 0.625rem" }}
                  >
                    <X size={13} />
                    Limpiar
                  </button>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                  gap: "0.875rem",
                }}
              >
                <div>
                  <label className="label">Especie</label>
                  <select
                    className="input"
                    value={filterEspecie}
                    onChange={(e) => setFilterEspecie(e.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">Todas</option>
                    {especieOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">ID Animal</label>
                  <input
                    type="text"
                    className="input"
                    value={filterAnimal}
                    onChange={(e) => setFilterAnimal(e.target.value)}
                    placeholder="Buscar ID..."
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">Todos</option>
                    {tipoOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Desde</label>
                  <input
                    type="date"
                    className="input"
                    value={filterDesde}
                    onChange={(e) => setFilterDesde(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Hasta</label>
                  <input
                    type="date"
                    className="input"
                    value={filterHasta}
                    onChange={(e) => setFilterHasta(e.target.value)}
                  />
                </div>
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
                  <th>Especie</th>
                  <th>Tipo</th>
                  <th>Tratamiento</th>
                  <th>Producto</th>
                  <th>Dosis</th>
                  <th style={{ textAlign: "center" }}>Retiro</th>
                  <th>Responsable</th>
                  <th style={{ textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {/* Loading skeletons */}
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} cols={10} />
                  ))}

                {/* Filas de datos */}
                {!loading &&
                  !error &&
                  filtered.map((r, idx) => {
                    const restantes = diasRetiroRestantes(r.fecha, r.diasRetiro);
                    const enRetiroActivo = restantes !== null;
                    const retiroCompletado = r.diasRetiro > 0 && !enRetiroActivo;

                    return (
                      <tr
                        key={r.id ?? idx}
                        className="animate-fade-in"
                        style={{
                          animationDelay: `${Math.min(idx * 25, 300)}ms`,
                          background: enRetiroActivo
                            ? "linear-gradient(90deg, #fff7ed 0%, #fffbeb 100%)"
                            : undefined,
                          borderLeft: enRetiroActivo
                            ? "3px solid #f59e0b"
                            : "3px solid transparent",
                        }}
                      >
                        {/* Fecha */}
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              background: "var(--color-primary-muted)",
                              color: "var(--color-primary-dark)",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.175rem 0.5rem",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(r.fecha)}
                          </span>
                        </td>

                        {/* ID Animal */}
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--color-primary-dark)",
                              fontSize: "0.875rem",
                              fontFamily: "var(--font-display)",
                            }}
                          >
                            {r.idAnimal}
                          </span>
                        </td>

                        {/* Especie */}
                        <td>
                          <span className="badge badge-green">{r.especie}</span>
                        </td>

                        {/* Tipo */}
                        <td>
                          <span className="badge badge-blue">{r.tipo}</span>
                        </td>

                        {/* Tratamiento */}
                        <td
                          style={{
                            color: "var(--color-text)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {r.tratamiento}
                        </td>

                        {/* Producto */}
                        <td
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.875rem",
                            fontStyle: "italic",
                          }}
                        >
                          {r.producto}
                        </td>

                        {/* Dosis */}
                        <td
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {r.dosis || (
                            <span style={{ color: "var(--color-text-light)" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Días retiro */}
                        <td style={{ textAlign: "center" }}>
                          {r.diasRetiro > 0 ? (
                            <span
                              style={{
                                fontWeight: 700,
                                color: enRetiroActivo
                                  ? "#b45309"
                                  : "var(--color-text-muted)",
                                fontSize: "0.875rem",
                              }}
                            >
                              {r.diasRetiro}d
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "var(--color-text-light)",
                                fontSize: "0.8rem",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        {/* Responsable */}
                        <td
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {r.responsable || (
                            <span style={{ color: "var(--color-text-light)" }}>
                              —
                            </span>
                          )}
                        </td>

                        {/* Estado badge */}
                        <td
                          style={{ textAlign: "center", whiteSpace: "nowrap" }}
                        >
                          {enRetiroActivo ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                background: "#fef3c7",
                                color: "#92400e",
                                border: "1px solid #fcd34d",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "999px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              <AlertTriangle size={10} />
                              En retiro ({restantes}d)
                            </span>
                          ) : retiroCompletado ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                background: "#dcfce7",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "999px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={10} />
                              Retiro completado
                            </span>
                          ) : (
                            <span
                              className="badge badge-gray"
                              style={{ fontSize: "0.7rem" }}
                            >
                              Sin retiro
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Empty state — sin datos */}
            {!loading && !error && records.length === 0 && (
              <div className="empty-state animate-fade-in">
                <PackageOpen className="empty-state-icon" />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--color-primary-dark)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Sin registros sanitarios
                </p>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--color-text-light)",
                    maxWidth: 340,
                  }}
                >
                  Todavía no hay tratamientos registrados. Usá el botón{" "}
                  <strong>Nuevo Tratamiento</strong> para agregar el primero.
                </p>
              </div>
            )}

            {/* Empty state — filtros sin resultados */}
            {!loading && !error && records.length > 0 && filtered.length === 0 && (
              <div className="empty-state animate-fade-in">
                <Filter
                  style={{
                    width: 48,
                    height: 48,
                    opacity: 0.35,
                    color: "var(--color-primary)",
                    marginBottom: "1rem",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "var(--color-primary-dark)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Sin resultados para los filtros aplicados
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={clearFilters}
                  style={{ marginTop: "0.75rem" }}
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Footer count */}
          {!loading && !error && filtered.length > 0 && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-light)",
                marginTop: "0.75rem",
                textAlign: "right",
              }}
            >
              {filtered.length}{" "}
              {filtered.length === 1 ? "registro" : "registros"}
              {hasFilters && ` (de ${records.length} en total)`}
            </p>
          )}
        </section>
      </div>

      {/* Modal */}
      {showModal && (
        <SanidadModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
