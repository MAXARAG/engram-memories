"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Baby,
  Plus,
  Filter,
  X,
  PackageOpen,
  Scale,
  ChevronDown,
  ShoppingCart,
  Beef,
  TrendingUp,
} from "lucide-react";
import type { Destete, DestinoDestete } from "@/types";
import { DesteteModal } from "@/components/destete/DesteteModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(dateStr: string): string {
  const parts = dateStr?.split("/");
  if (parts?.length !== 3) return "";
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
}

function parseDMY(dateStr: string): Date | null {
  const parts = dateStr?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
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

function formatKg(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " kg";
}

// ─── Badge por destino ────────────────────────────────────────────────────────

const DESTINO_BADGE: Record<DestinoDestete, string> = {
  Recría: "badge-green",
  Venta: "badge-blue",
  Engorde: "badge-amber",
};

function DestinoBadge({ destino }: { destino: DestinoDestete }) {
  return <span className={`badge ${DESTINO_BADGE[destino]}`}>{destino}</span>;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <div
            style={{
              height: 14,
              borderRadius: 4,
              background:
                "linear-gradient(90deg, #e8f0e6 25%, #d4e6d0 50%, #e8f0e6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
              width: i === 7 ? "75%" : i === 0 ? "80%" : "55%",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}

function SummaryCard({ icon, label, value, accent }: SummaryCardProps) {
  return (
    <div
      className="stat-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          background: accent
            ? "linear-gradient(135deg, var(--color-accent-muted), #fde68a)"
            : "var(--color-primary-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: accent ? "var(--color-accent)" : "var(--color-primary)",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.125rem",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.375rem",
            fontWeight: 700,
            color: accent ? "var(--color-accent)" : "var(--color-primary-dark)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Destino Mini Card ─────────────────────────────────────────────────────────

interface DestinoCardProps {
  label: DestinoDestete;
  count: number;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

function DestinoCard({ label, count, Icon, color, bg }: DestinoCardProps) {
  return (
    <div
      className="stat-card"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color,
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.125rem",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-primary-dark)",
          }}
        >
          {count.toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  );
}

// ─── Destino list (stable reference) ─────────────────────────────────────────

const DESTINO_LIST: DestinoDestete[] = ["Recría", "Venta", "Engorde"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DestetePage() {
  const [records, setRecords] = useState<Destete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterDestino, setFilterDestino] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getAllDestete } = await import("@/lib/api");
        const res = await getAllDestete();
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

  // Unique filter options from data
  const especieOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.especie))).sort(),
    [records]
  );

  // Apply filters
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie && r.especie !== filterEspecie) return false;
      if (filterDestino && r.destino !== filterDestino) return false;
      if (filterDesde || filterHasta) {
        const iso = toISO(r.fecha);
        if (filterDesde && iso < filterDesde) return false;
        if (filterHasta && iso > filterHasta) return false;
      }
      return true;
    });
  }, [records, filterEspecie, filterDestino, filterDesde, filterHasta]);

  // Stats from full record set (not filtered)
  const totalCrias = useMemo(
    () => records.reduce((sum, r) => sum + r.nCrias, 0),
    [records]
  );

  const promedioGeneral = useMemo(() => {
    const totalPeso = records.reduce((sum, r) => sum + r.peso, 0);
    const totalN = records.reduce((sum, r) => sum + r.nCrias, 0);
    return totalN > 0 ? totalPeso / totalN : 0;
  }, [records]);

  const porDestino = useMemo(
    () =>
      DESTINO_LIST.reduce(
        (acc, dest) => ({
          ...acc,
          [dest]: records
            .filter((r) => r.destino === dest)
            .reduce((sum, r) => sum + r.nCrias, 0),
        }),
        {} as Record<DestinoDestete, number>
      ),
    [records]
  );

  const hasFilters = !!(filterEspecie || filterDestino || filterDesde || filterHasta);

  function clearFilters() {
    setFilterEspecie("");
    setFilterDestino("");
    setFilterDesde("");
    setFilterHasta("");
  }

  function handleSaved(record: Destete) {
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
                <Baby size={20} />
              </div>
              <h1 className="page-title">Destete</h1>
            </div>
            <p className="page-subtitle">
              Historial de destetes por especie, lote y destino
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
              Registrar Destete
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        {!loading && !error && (
          <>
            {/* Fila 1: totales globales */}
            <div
              className="stagger"
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <SummaryCard
                icon={<Baby size={20} />}
                label="Total Crías Destetadas"
                value={totalCrias.toLocaleString("es-AR")}
              />
              <SummaryCard
                icon={<Scale size={20} />}
                label="Peso Promedio General"
                value={promedioGeneral > 0 ? formatKg(promedioGeneral) : "—"}
                accent
              />
              <div
                className="stat-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flex: 1,
                  minWidth: 0,
                }}
              >
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
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "0.125rem",
                    }}
                  >
                    Eventos
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.375rem",
                      fontWeight: 700,
                      color: "var(--color-primary-dark)",
                    }}
                  >
                    {records.length.toLocaleString("es-AR")}
                    {hasFilters && (
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-text-muted)",
                          fontWeight: 400,
                          fontFamily: "var(--font-body)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        / {filtered.length} filtrados
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Fila 2: por destino */}
            <div
              className="stagger"
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              <DestinoCard
                label="Recría"
                count={porDestino["Recría"] ?? 0}
                Icon={Baby}
                color="#166534"
                bg="#dcfce7"
              />
              <DestinoCard
                label="Venta"
                count={porDestino["Venta"] ?? 0}
                Icon={ShoppingCart}
                color="#1e40af"
                bg="#dbeafe"
              />
              <DestinoCard
                label="Engorde"
                count={porDestino["Engorde"] ?? 0}
                Icon={Beef}
                color="#9a3412"
                bg="#fed7aa"
              />
            </div>
          </>
        )}

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="card animate-fade-in" style={{ marginBottom: "1.5rem" }}>
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
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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
                <label className="label">Destino</label>
                <select
                  className="input"
                  value={filterDestino}
                  onChange={(e) => setFilterDestino(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="">Todos</option>
                  {DESTINO_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
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

        {/* ── Error State ── */}
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

        {/* ── Table ── */}
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>ID Cría</th>
                <th>Madre</th>
                <th>Especie</th>
                <th style={{ textAlign: "right" }}>N° Crías</th>
                <th style={{ textAlign: "right" }}>Peso Total</th>
                <th style={{ textAlign: "right" }}>Promedio kg</th>
                <th>Destino</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeletons */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}

              {/* Data rows */}
              {!loading &&
                !error &&
                filtered.map((r, idx) => (
                  <tr
                    key={r.id ?? idx}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                  >
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
                        {formatDate(r.fecha)}
                      </span>
                    </td>
                    <td>
                      <code
                        style={{
                          fontSize: "0.8125rem",
                          background: "var(--color-primary-muted)",
                          color: "var(--color-primary-dark)",
                          borderRadius: "var(--radius-sm)",
                          padding: "0.15rem 0.4rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {r.idCria}
                      </code>
                    </td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                      {r.madre}
                    </td>
                    <td>
                      <span className="badge badge-green">{r.especie}</span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "var(--color-text-muted)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {r.nCrias.toLocaleString("es-AR")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "var(--color-primary-dark)",
                        }}
                      >
                        {formatKg(r.peso)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "var(--color-accent)",
                        }}
                      >
                        {formatKg(r.promedio)}
                      </span>
                    </td>
                    <td>
                      <DestinoBadge destino={r.destino} />
                    </td>
                  </tr>
                ))}
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
                Sin registros de destete
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--color-text-light)",
                  maxWidth: 320,
                }}
              >
                Todavía no hay destetes registrados. Usá el botón{" "}
                <strong>Registrar Destete</strong> para agregar el primero.
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
      </div>

      {/* Modal */}
      {showModal && (
        <DesteteModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
