"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Scissors,
  Plus,
  Filter,
  X,
  PackageOpen,
  TrendingUp,
  Weight,
  FlaskConical,
  ChevronDown,
} from "lucide-react";
import type { Faena } from "@/types";
import { FaenaModal } from "@/components/faena/FaenaModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** DD/MM/YYYY → Date (noon local para evitar off-by-one de timezone) */
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

type RendimientoNivel = "alto" | "medio" | "bajo";

function rendimientoNivel(pct: number): RendimientoNivel {
  if (pct > 60) return "alto";
  if (pct >= 50) return "medio";
  return "bajo";
}

const NIVEL_BADGE: Record<RendimientoNivel, { cls: string; label: string }> = {
  alto:  { cls: "badge badge-green",  label: "Excelente" },
  medio: { cls: "badge badge-amber",  label: "Aceptable" },
  bajo:  { cls: "badge badge-red",    label: "Bajo" },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div
        style={{
          height: 12,
          width: "60%",
          borderRadius: 4,
          background:
            "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          marginBottom: "0.75rem",
        }}
      />
      <div
        style={{
          height: 28,
          width: "40%",
          borderRadius: 4,
          background:
            "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
        }}
      />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

function StatCard({ label, value, sub, icon, accentColor }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fade-in"
      style={accentColor ? { "--stat-accent": accentColor } as React.CSSProperties : undefined}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-muted)",
              marginBottom: "0.5rem",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {sub && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginTop: "0.375rem",
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
            borderRadius: "var(--radius-md)",
            background: "var(--color-primary-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--color-primary)",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FaenaPage() {
  const [registros, setRegistros] = useState<Faena[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const { getAllFaena } = await import("@/lib/api");
        const result = await getAllFaena();
        if (!result.success) throw new Error(result.error ?? "Error al cargar los registros.");
        setRegistros(result.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Especies únicas para filtro ───────────────────────────────────────────

  const especiesUnicas = useMemo(() => {
    const set = new Set(registros.map((r) => r.especie).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  // ── Filtrado ──────────────────────────────────────────────────────────────

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (filterEspecie && r.especie.toLowerCase() !== filterEspecie.toLowerCase())
        return false;
      if (filterDesde) {
        const iso = toISO(r.fecha);
        if (iso && iso < filterDesde) return false;
      }
      if (filterHasta) {
        const iso = toISO(r.fecha);
        if (iso && iso > filterHasta) return false;
      }
      return true;
    });
  }, [registros, filterEspecie, filterDesde, filterHasta]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = registros.length;
    const rendProm =
      total > 0
        ? registros.reduce((acc, r) => acc + (r.rendimiento ?? 0), 0) / total
        : 0;
    const pesoTotal = registros.reduce((acc, r) => acc + (r.pesoCanal ?? 0), 0);
    return { total, rendProm, pesoTotal };
  }, [registros]);

  const hasFilters = !!(filterEspecie || filterDesde || filterHasta);

  function clearFilters() {
    setFilterEspecie("");
    setFilterDesde("");
    setFilterHasta("");
  }

  function handleSaved(record: Faena) {
    setRegistros((prev) => [record, ...prev]);
    setShowModal(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Scissors
              size={28}
              style={{ color: "var(--color-primary)", flexShrink: 0 }}
            />
            Faena
          </h1>
          <p className="page-subtitle">
            Historial de faena · {registros.length}{" "}
            {registros.length === 1 ? "registro" : "registros"} totales
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Registrar Faena
        </button>
      </div>

      {/* ── Stat Cards ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[0, 1, 2].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      ) : (
        <div
          className="stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <StatCard
            label="Animales Faenados"
            value={stats.total.toString()}
            sub="registros históricos"
            icon={<Scissors size={22} />}
          />
          <StatCard
            label="Rendimiento Promedio"
            value={stats.total > 0 ? `${stats.rendProm.toFixed(1)}%` : "—"}
            sub={
              stats.total > 0
                ? rendimientoNivel(stats.rendProm) === "alto"
                  ? "Excelente rendimiento"
                  : rendimientoNivel(stats.rendProm) === "medio"
                  ? "Rendimiento aceptable"
                  : "Rendimiento bajo"
                : "Sin datos aún"
            }
            icon={<TrendingUp size={22} />}
          />
          <StatCard
            label="Peso Canal Total"
            value={
              stats.pesoTotal >= 1000
                ? `${(stats.pesoTotal / 1000).toFixed(2)} t`
                : `${stats.pesoTotal.toLocaleString("es-AR")} kg`
            }
            sub="suma de todos los canales"
            icon={<Weight size={22} />}
          />
        </div>
      )}

      {/* ── Filtros ── */}
      <div
        className="card"
        style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setShowFilters((v) => !v)}
            style={{
              color: hasFilters ? "var(--color-primary)" : "var(--color-text-muted)",
              padding: "0.375rem 0.75rem",
              fontWeight: hasFilters ? 600 : 400,
            }}
          >
            <Filter size={15} />
            {hasFilters ? "Filtros activos" : "Filtrar"}
            <ChevronDown
              size={14}
              style={{
                transition: "transform 0.2s",
                transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {hasFilters && (
            <button
              className="btn btn-ghost"
              onClick={clearFilters}
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-error)",
                padding: "0.375rem 0.75rem",
              }}
            >
              <X size={13} />
              Limpiar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div
            className="animate-fade-in"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
              marginTop: "0.875rem",
              paddingTop: "0.875rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {/* Especie */}
            <div>
              <label className="label" htmlFor="f-especie">
                Especie
              </label>
              <select
                id="f-especie"
                value={filterEspecie}
                onChange={(e) => setFilterEspecie(e.target.value)}
                className="input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Todas las especies</option>
                {especiesUnicas.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="label" htmlFor="f-desde">
                Desde
              </label>
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
              <label className="label" htmlFor="f-hasta">
                Hasta
              </label>
              <input
                id="f-hasta"
                type="date"
                value={filterHasta}
                onChange={(e) => setFilterHasta(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Tabla ── */}
      {error ? (
        <div
          className="card animate-fade-in"
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "var(--color-error)",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            Error al cargar los registros
          </p>
          <p style={{ fontSize: "0.875rem", opacity: 0.85 }}>{error}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>ID Animal</th>
                <th>Especie</th>
                <th>Peso Vivo</th>
                <th>Peso Canal</th>
                <th>Rendimiento</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={7} />
                ))
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      {hasFilters ? (
                        <>
                          <Filter
                            className="empty-state-icon"
                            size={48}
                          />
                          <p
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: "var(--color-primary-dark)",
                              marginBottom: "0.375rem",
                            }}
                          >
                            Sin resultados
                          </p>
                          <p style={{ fontSize: "0.9rem" }}>
                            Ningún registro coincide con los filtros aplicados.
                          </p>
                          <button
                            className="btn btn-secondary"
                            style={{ marginTop: "1rem" }}
                            onClick={clearFilters}
                          >
                            <X size={14} />
                            Limpiar filtros
                          </button>
                        </>
                      ) : (
                        <>
                          <PackageOpen
                            className="empty-state-icon"
                            size={56}
                          />
                          <p
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "1.1rem",
                              fontWeight: 600,
                              color: "var(--color-primary-dark)",
                              marginBottom: "0.375rem",
                            }}
                          >
                            Sin registros de faena
                          </p>
                          <p style={{ fontSize: "0.9rem" }}>
                            Registrá la primera faena para comenzar el historial.
                          </p>
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: "1rem" }}
                            onClick={() => setShowModal(true)}
                          >
                            <Plus size={14} />
                            Registrar Faena
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((r) => {
                  const nivel = rendimientoNivel(r.rendimiento);
                  const badge = NIVEL_BADGE[nivel];
                  return (
                    <tr key={r.id ?? `${r.fecha}-${r.idAnimal}`} className="animate-fade-in">
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                        {formatDate(r.fecha)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            color: "var(--color-primary-dark)",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {r.idAnimal}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-gray">{r.especie}</span>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {r.pesoVivo.toLocaleString("es-AR")} kg
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {r.pesoCanal.toLocaleString("es-AR")} kg
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              fontSize: "0.9375rem",
                              color:
                                nivel === "alto"
                                  ? "#166534"
                                  : nivel === "medio"
                                  ? "#92400e"
                                  : "#991b1b",
                            }}
                          >
                            {r.rendimiento.toFixed(1)}%
                          </span>
                          <span className={badge.cls} style={{ fontSize: "0.7rem" }}>
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: r.observaciones ? "var(--color-text)" : "var(--color-text-light)",
                          fontSize: "0.875rem",
                        }}
                        title={r.observaciones || undefined}
                      >
                        {r.observaciones || (
                          <span style={{ fontStyle: "italic" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer con conteo filtrado */}
          {!loading && filtrados.length > 0 && (
            <div
              style={{
                padding: "0.625rem 1rem",
                borderTop: "1px solid var(--color-border)",
                background: "var(--color-primary-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Mostrando{" "}
                <strong style={{ color: "var(--color-primary-dark)" }}>
                  {filtrados.length}
                </strong>{" "}
                {hasFilters
                  ? `de ${registros.length} registros`
                  : filtrados.length === 1
                  ? "registro"
                  : "registros"}
              </p>
              {hasFilters && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <FlaskConical size={13} style={{ color: "var(--color-text-light)" }} />
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    Rend. prom. filtrado:{" "}
                    <strong style={{ color: "var(--color-primary-dark)" }}>
                      {(
                        filtrados.reduce((acc, r) => acc + r.rendimiento, 0) /
                        filtrados.length
                      ).toFixed(1)}
                      %
                    </strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <FaenaModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
