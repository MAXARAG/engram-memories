"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Heart,
  Plus,
  Filter,
  X,
  PackageOpen,
  AlertTriangle,
  Calendar,
  ChevronDown,
  Syringe,
  Baby,
} from "lucide-react";
import type { Reproduccion } from "@/types";
import { ReproduccionModal } from "@/components/reproduccion/ReproduccionModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const GESTACION_DIAS: Record<string, number> = {
  Bovino:  280,
  Ovino:   150,
  Porcino: 114,
  Caprino: 150,
  Otro:    280,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDMY(dateStr: string): Date | null {
  const parts = dateStr?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

function toISO(dateStr: string): string {
  const parts = dateStr?.split("/");
  if (parts?.length !== 3) return "";
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
}

function formatDate(dateStr: string): string {
  const d = parseDMY(dateStr);
  if (!d) return dateStr || "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addDaysToDate(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function formatDateObj(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function estimatedParto(r: Reproduccion): Date | null {
  const serviceDate = parseDMY(r.fechaServicio);
  if (!serviceDate) return null;
  const dias = GESTACION_DIAS[r.especie] ?? 280;
  return addDaysToDate(serviceDate, dias);
}

function getEstado(r: Reproduccion): "Parida" | "Preñada" | "Pendiente" {
  if (r.fechaParto && r.nCrias > 0) return "Parida";
  if (r.diagnostico === "Positivo") return "Preñada";
  return "Pendiente";
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

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
              width: i === 0 ? "65%" : "55%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.5)",
        borderRadius: "var(--radius-md)",
        padding: "0.875rem 1rem",
        border: "1px solid rgba(255,255,255,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {[80, 60, 70].map((w, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 4,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            width: `${w}%`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: string }) {
  return tipo === "Natural" ? (
    <span className="badge badge-green" style={{ gap: "0.3rem" }}>
      <Heart size={10} />
      Natural
    </span>
  ) : (
    <span className="badge badge-blue" style={{ gap: "0.3rem" }}>
      <Syringe size={10} />
      Inseminación
    </span>
  );
}

function DiagnosticoBadge({ diagnostico }: { diagnostico: string }) {
  const map: Record<string, string> = {
    Positivo:       "badge-green",
    Negativo:       "badge-red",
    Pendiente:      "badge-amber",
    "No realizado": "badge-gray",
  };
  const cls = map[diagnostico] ?? "badge-gray";
  return <span className={`badge ${cls}`}>{diagnostico}</span>;
}

function EstadoBadge({ estado }: { estado: ReturnType<typeof getEstado> }) {
  if (estado === "Parida")  return <span className="badge badge-green">Parida</span>;
  if (estado === "Preñada") return <span className="badge badge-amber">Preñada</span>;
  return <span className="badge badge-gray">Pendiente</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReproduccionPage() {
  const [records, setRecords] = useState<Reproduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterEspecie,  setFilterEspecie]  = useState("");
  const [filterTipo,     setFilterTipo]     = useState("");
  const [filterIdMadre,  setFilterIdMadre]  = useState("");
  const [filterDesde,    setFilterDesde]    = useState("");
  const [filterHasta,    setFilterHasta]    = useState("");

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getAllReproduccion } = await import("@/lib/api");
        const res = await getAllReproduccion();
        if (cancelled) return;
        if (!res.success) throw new Error(res.error ?? "Error al cargar datos.");
        setRecords(res.data ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const today = useMemo(() => new Date(), []);

  // ── Section 1: próximos partos (next 30 days) ──────────────────────────────
  const proximosPartos = useMemo(() => {
    if (loading) return [];
    return records
      .filter((r) => {
        if (r.fechaParto && r.nCrias > 0) return false;
        const ep = estimatedParto(r);
        if (!ep) return false;
        const dias = diffDays(ep, today);
        return dias >= 0 && dias <= 30;
      })
      .map((r) => {
        const ep = estimatedParto(r)!;
        return { r, ep, diasRestantes: diffDays(ep, today) };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [records, loading, today]);

  // ── Section 2: servicios recientes (últimos 30 días) ──────────────────────
  const serviciosRecientes = useMemo(() => {
    if (loading) return [];
    const hace30 = addDaysToDate(today, -30);
    return records.filter((r) => {
      const d = parseDMY(r.fechaServicio);
      if (!d) return false;
      return d >= hace30 && d <= today;
    });
  }, [records, loading, today]);

  // ── Section 3: filtered history ────────────────────────────────────────────
  const especieOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.especie))).sort(),
    [records]
  );

  const hasFilters = !!(filterEspecie || filterTipo || filterIdMadre || filterDesde || filterHasta);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie  && r.especie !== filterEspecie) return false;
      if (filterTipo     && r.tipoServicio !== filterTipo) return false;
      if (filterIdMadre  && !r.idMadre.toLowerCase().includes(filterIdMadre.toLowerCase())) return false;
      if (filterDesde || filterHasta) {
        const iso = toISO(r.fechaServicio);
        if (filterDesde && iso < filterDesde) return false;
        if (filterHasta && iso > filterHasta) return false;
      }
      return true;
    });
  }, [records, filterEspecie, filterTipo, filterIdMadre, filterDesde, filterHasta]);

  function clearFilters() {
    setFilterEspecie("");
    setFilterTipo("");
    setFilterIdMadre("");
    setFilterDesde("");
    setFilterHasta("");
  }

  function handleSaved(record: Reproduccion) {
    setRecords((prev) => [record, ...prev]);
    setShowModal(false);
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(185,28,28,0); }
        }
      `}</style>

      <div style={{ padding: "2rem", maxWidth: 1400, margin: "0 auto" }} className="animate-fade-in">

        {/* ── Page Header ── */}
        <div className="page-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div
                style={{
                  background: "var(--color-primary-muted)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.375rem",
                  display: "flex",
                  color: "var(--color-primary)",
                }}
              >
                <Heart size={20} />
              </div>
              <h1 className="page-title">Reproducción</h1>
            </div>
            <p className="page-subtitle">
              Control de servicios, gestaciones y partos del rodeo
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Nuevo Servicio
          </button>
        </div>

        {/* ── Error state ── */}
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

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 1 — PARTOS PRÓXIMOS
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: "2rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1e3d1a 0%, #2d5a27 60%, #3d7a35 100%)",
              borderRadius: "var(--radius-xl)",
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "var(--shadow-lg)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative radial glow */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, rgba(139,105,20,0.18) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />

            {/* Section heading */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1.25rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem",
                  display: "flex",
                }}
              >
                <Baby size={18} color="#fff" />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  Partos próximos
                </h2>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "1px" }}>
                  Hembras con parto estimado en los próximos 30 días
                </p>
              </div>
              {!loading && proximosPartos.length > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "0.2rem 0.75rem",
                    flexShrink: 0,
                  }}
                >
                  {proximosPartos.length} {proximosPartos.length === 1 ? "hembra" : "hembras"}
                </span>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div
                className="stagger"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty */}
            {!loading && proximosPartos.length === 0 && (
              <div
                className="animate-fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "2rem",
                  textAlign: "center",
                  gap: "0.625rem",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart size={22} color="rgba(255,255,255,0.5)" />
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Sin partos próximos
                </p>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                  No hay hembras con parto esperado en los próximos 30 días
                </p>
              </div>
            )}

            {/* Cards grid */}
            {!loading && proximosPartos.length > 0 && (
              <div
                className="stagger"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {proximosPartos.map(({ r, ep, diasRestantes }) => {
                  const urgente = diasRestantes <= 7;
                  return (
                    <div
                      key={r.id ?? r.idMadre}
                      className="animate-fade-in"
                      style={{
                        background: urgente ? "rgba(185,28,28,0.12)" : "rgba(255,255,255,0.1)",
                        border: urgente
                          ? "1.5px solid rgba(185,28,28,0.45)"
                          : "1px solid rgba(255,255,255,0.18)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.875rem 1rem",
                        backdropFilter: "blur(4px)",
                        animation: urgente
                          ? "fadeIn 0.3s ease both, pulse-border 2s ease-in-out 0.3s infinite"
                          : "fadeIn 0.3s ease both",
                        position: "relative",
                      }}
                    >
                      {urgente && (
                        <span
                          style={{
                            position: "absolute",
                            top: "0.625rem",
                            right: "0.625rem",
                            background: "#b91c1c",
                            color: "#fff",
                            fontSize: "0.675rem",
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: "0.175rem 0.55rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          <AlertTriangle size={10} />
                          Urgente
                        </span>
                      )}

                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: urgente ? "#fca5a5" : "#fff",
                          letterSpacing: "0.01em",
                          marginBottom: "1px",
                        }}
                      >
                        {r.idMadre}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", marginBottom: "0.5rem" }}>
                        {r.especie}
                      </p>

                      <div style={{ marginBottom: "0.625rem" }}>
                        <TipoBadge tipo={r.tipoServicio} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                        <Calendar size={12} color="rgba(255,255,255,0.45)" />
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                          Servicio: {formatDate(r.fechaServicio)}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Baby size={12} color="rgba(255,255,255,0.45)" />
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                          Parto est.: {formatDateObj(ep)}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "0.75rem",
                          paddingTop: "0.625rem",
                          borderTop: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            background: urgente ? "rgba(185,28,28,0.5)" : "rgba(255,255,255,0.15)",
                            color: urgente ? "#fca5a5" : "rgba(255,255,255,0.9)",
                            fontFamily: "var(--font-display)",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: "0.2rem 0.75rem",
                          }}
                        >
                          {diasRestantes === 0
                            ? "¡Hoy!"
                            : `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 2 — SERVICIOS RECIENTES
        ══════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: 3,
                height: 22,
                borderRadius: 2,
                background: "linear-gradient(to bottom, var(--color-primary), var(--color-accent))",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-primary-dark)",
              }}
            >
              Servicios recientes
            </h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-light)", fontStyle: "italic" }}>
              últimos 30 días
            </span>
            {!loading && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "var(--color-primary-muted)",
                  color: "var(--color-primary-dark)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderRadius: 999,
                  padding: "0.175rem 0.65rem",
                }}
              >
                {serviciosRecientes.length}
              </span>
            )}
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Madre</th>
                  <th>Especie</th>
                  <th>Macho</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}

                {!loading && serviciosRecientes.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
                        <Calendar className="empty-state-icon" />
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--color-primary-dark)",
                            marginBottom: "0.375rem",
                          }}
                        >
                          Sin servicios recientes
                        </p>
                        <p style={{ fontSize: "0.875rem", color: "var(--color-text-light)" }}>
                          No hay servicios registrados en los últimos 30 días
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  serviciosRecientes.map((r, idx) => (
                    <tr
                      key={r.id ?? idx}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                    >
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "var(--color-primary-dark)",
                          }}
                        >
                          {r.idMadre}
                        </span>
                      </td>
                      <td><span className="badge badge-green">{r.especie}</span></td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{r.macho}</td>
                      <td><TipoBadge tipo={r.tipoServicio} /></td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            background: "var(--color-primary-muted)",
                            color: "var(--color-primary-dark)",
                            borderRadius: "var(--radius-sm)",
                            padding: "0.175rem 0.5rem",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(r.fechaServicio)}
                        </span>
                      </td>
                      <td><DiagnosticoBadge diagnostico={r.diagnostico} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 3 — HISTORIAL COMPLETO
        ══════════════════════════════════════════════════════════════════ */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div
                style={{
                  width: 3,
                  height: 22,
                  borderRadius: 2,
                  background: "linear-gradient(to bottom, var(--color-primary), var(--color-accent))",
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                }}
              >
                Historial completo
              </h2>
            </div>
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
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="card animate-fade-in" style={{ marginBottom: "1rem" }}>
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
                  <label className="label">ID Madre</label>
                  <input
                    type="text"
                    className="input"
                    value={filterIdMadre}
                    onChange={(e) => setFilterIdMadre(e.target.value)}
                    placeholder="Buscar ID..."
                  />
                </div>
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
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Tipo Servicio</label>
                  <select
                    className="input"
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">Todos</option>
                    <option value="Natural">Natural</option>
                    <option value="Inseminación">Inseminación</option>
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

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Madre</th>
                  <th>Especie</th>
                  <th>Macho</th>
                  <th>Tipo</th>
                  <th>Fecha Servicio</th>
                  <th>Diagnóstico</th>
                  <th>Fecha Parto</th>
                  <th style={{ textAlign: "center" }}>Crías</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} cols={9} />)}

                {!loading &&
                  !error &&
                  filtered.map((r, idx) => {
                    const estado = getEstado(r);
                    return (
                      <tr
                        key={r.id ?? idx}
                        className="animate-fade-in"
                        style={{ animationDelay: `${Math.min(idx * 25, 400)}ms` }}
                      >
                        <td>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              color: "var(--color-primary-dark)",
                            }}
                          >
                            {r.idMadre}
                          </span>
                        </td>
                        <td><span className="badge badge-green">{r.especie}</span></td>
                        <td style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{r.macho}</td>
                        <td><TipoBadge tipo={r.tipoServicio} /></td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              background: "var(--color-primary-muted)",
                              color: "var(--color-primary-dark)",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.175rem 0.5rem",
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatDate(r.fechaServicio)}
                          </span>
                        </td>
                        <td><DiagnosticoBadge diagnostico={r.diagnostico} /></td>
                        <td style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                          {r.fechaParto ? formatDate(r.fechaParto) : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {r.nCrias > 0 ? (
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                color: "var(--color-primary-dark)",
                              }}
                            >
                              {r.nCrias}
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-light)" }}>—</span>
                          )}
                        </td>
                        <td><EstadoBadge estado={estado} /></td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Empty — sin registros */}
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
                  Sin registros reproductivos
                </p>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-light)", maxWidth: 320 }}>
                  Todavía no hay servicios registrados. Usá el botón{" "}
                  <strong>Nuevo Servicio</strong> para agregar el primero.
                </p>
              </div>
            )}

            {/* Empty — filtros sin resultado */}
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
                <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: "0.75rem" }}>
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
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
              {hasFilters && ` (de ${records.length} en total)`}
            </p>
          )}
        </section>
      </div>

      {/* Modal */}
      {showModal && (
        <ReproduccionModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
