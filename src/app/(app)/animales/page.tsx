"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Beef,
  Plus,
  Filter,
  X,
  PackageOpen,
  Search,
  ChevronDown,
} from "lucide-react";
import type { Animal } from "@/types";
import { AnimalModal } from "@/components/animales/AnimalModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDMY(str: string): Date | null {
  const parts = str?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
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

const ESTADO_BADGE: Record<string, string> = {
  Activo: "badge badge-green",
  Vendido: "badge badge-amber",
  Muerto: "badge badge-red",
  Faenado: "badge badge-gray",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnimalesPage() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");

  // Load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getStock } = await import("@/lib/api");
        const res = await getStock();
        if (cancelled) return;
        if (!res.success) throw new Error(res.error ?? "Error al cargar datos.");
        setAnimales(res.data ?? []);
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

  // Unique values for filter dropdowns
  const especieOptions = useMemo(
    () => Array.from(new Set(animales.map((a) => a.especie).filter(Boolean))).sort(),
    [animales]
  );
  const estadoOptions = useMemo(
    () => Array.from(new Set(animales.map((a) => a.estado).filter(Boolean))).sort(),
    [animales]
  );

  // Apply filters
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return animales.filter((a) => {
      if (filterEspecie && a.especie !== filterEspecie) return false;
      if (filterEstado && a.estado !== filterEstado) return false;
      if (
        q &&
        !a.idAnimal.toLowerCase().includes(q) &&
        !a.categoria.toLowerCase().includes(q) &&
        !a.raza.toLowerCase().includes(q) &&
        !(a.ubicacion || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [animales, filterEspecie, filterEstado, search]);

  // Stats
  const activos = useMemo(
    () => animales.filter((a) => a.estado === "Activo").length,
    [animales]
  );

  const hasFilters = !!(filterEspecie || filterEstado || search);

  function clearFilters() {
    setFilterEspecie("");
    setFilterEstado("");
    setSearch("");
  }

  function handleSaved(animal: Animal) {
    setAnimales((prev) => [animal, ...prev]);
    setShowModal(false);
  }

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

      {/* Header */}
      <div className="page-header">
        <div>
          <h1
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
          >
            <Beef
              size={28}
              style={{ color: "var(--color-primary)", flexShrink: 0 }}
            />
            Animales
          </h1>
          <p className="page-subtitle">
            Stock del establecimiento · {animales.length}{" "}
            {animales.length === 1 ? "animal" : "animales"} registrados ·{" "}
            {activos} activos
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Nuevo Animal
        </button>
      </div>

      {/* Filtros */}
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
          {/* Search */}
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              maxWidth: 360,
            }}
          >
            <Search
              size={15}
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
              type="text"
              className="input"
              placeholder="Buscar por ID, categoría, raza, ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setShowFilters((v) => !v)}
              style={{
                color: hasFilters
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
                padding: "0.375rem 0.75rem",
                fontWeight: hasFilters ? 600 : 400,
              }}
            >
              <Filter size={15} />
              Filtros
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
                Limpiar
              </button>
            )}
          </div>
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
                <option value="">Todas</option>
                {especieOptions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-estado">
                Estado
              </label>
              <select
                id="f-estado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="input"
                style={{ cursor: "pointer" }}
              >
                <option value="">Todos</option>
                {estadoOptions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="card animate-fade-in"
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "var(--color-error)",
            textAlign: "center",
            padding: "2rem",
            marginBottom: "1.25rem",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            Error al cargar los animales
          </p>
          <p style={{ fontSize: "0.875rem", opacity: 0.85 }}>{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Especie</th>
              <th>Categoría</th>
              <th>Raza</th>
              <th>Sexo</th>
              <th>Nacimiento</th>
              <th>Estado</th>
              <th>Origen</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} cols={9} />
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    {hasFilters ? (
                      <>
                        <Filter className="empty-state-icon" size={48} />
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
                          Ningún animal coincide con los filtros aplicados.
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
                        <PackageOpen className="empty-state-icon" size={56} />
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: "var(--color-primary-dark)",
                            marginBottom: "0.375rem",
                          }}
                        >
                          Sin animales registrados
                        </p>
                        <p style={{ fontSize: "0.9rem" }}>
                          Registrá el primer animal para comenzar el stock.
                        </p>
                        <button
                          className="btn btn-primary"
                          style={{ marginTop: "1rem" }}
                          onClick={() => setShowModal(true)}
                        >
                          <Plus size={14} />
                          Nuevo Animal
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.idAnimal}
                  className="animate-fade-in"
                >
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        color: "var(--color-primary-dark)",
                        fontSize: "0.9375rem",
                      }}
                    >
                      {a.idAnimal}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-gray">{a.especie}</span>
                  </td>
                  <td>{a.categoria}</td>
                  <td
                    style={{
                      color: a.raza
                        ? "var(--color-text)"
                        : "var(--color-text-light)",
                    }}
                  >
                    {a.raza || "—"}
                  </td>
                  <td>{a.sexo}</td>
                  <td
                    style={{
                      whiteSpace: "nowrap",
                      color: "var(--color-text-muted)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {formatDate(a.fechaNac)}
                  </td>
                  <td>
                    <span className={ESTADO_BADGE[a.estado] ?? "badge"}>
                      {a.estado}
                    </span>
                  </td>
                  <td>{a.origen}</td>
                  <td
                    style={{
                      color: a.ubicacion
                        ? "var(--color-text)"
                        : "var(--color-text-light)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {a.ubicacion || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "0.625rem 1rem",
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-primary-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Mostrando{" "}
              <strong style={{ color: "var(--color-primary-dark)" }}>
                {filtered.length}
              </strong>{" "}
              {hasFilters
                ? `de ${animales.length} animales`
                : filtered.length === 1
                ? "animal"
                : "animales"}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AnimalModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
