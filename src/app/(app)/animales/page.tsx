"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, X, PackageOpen, Search, ChevronDown, ClipboardList } from "lucide-react";
import type { AnimalRow } from "@/types/database";
import { AnimalModal } from "@/components/animales/AnimalModal";
import { RowActions } from "@/components/common/RowActions";
import { CowIcon } from "@/components/icons/CowIcon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTADO_BADGE: Record<string, string> = {
  Activo: "badge badge-green",
  Vendido: "badge badge-amber",
  Muerto: "badge badge-red",
  Faenado: "badge badge-gray",
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-bar" style={{ width: "45%", marginBottom: "0.75rem" }} />
      <div className="skeleton-bar" style={{ width: "70%", marginBottom: "0.5rem" }} />
      <div className="skeleton-bar" style={{ width: "55%", marginBottom: "0.5rem" }} />
      <div className="skeleton-bar" style={{ width: "40%" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnimalesPage() {
  const router = useRouter();
  const [animales, setAnimales] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getAnimales } = await import("@/lib/api");
        const rows = await getAnimales();
        if (cancelled) return;
        setAnimales(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const especieOptions = useMemo(() => Array.from(new Set(animales.map((a) => a.especie).filter(Boolean))).sort(), [animales]);
  const estadoOptions = useMemo(() => Array.from(new Set(animales.map((a) => a.estado).filter(Boolean))).sort(), [animales]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return animales.filter((a) => {
      if (filterEspecie && a.especie !== filterEspecie) return false;
      if (filterEstado && a.estado !== filterEstado) return false;
      if (q && !a.identificador.toLowerCase().includes(q) && !a.categoria.toLowerCase().includes(q) && !(a.raza ?? "").toLowerCase().includes(q) && !(a.lote ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [animales, filterEspecie, filterEstado, search]);

  const activos = useMemo(() => animales.filter((a) => a.estado === "Activo").length, [animales]);
  const hasFilters = !!(filterEspecie || filterEstado || search);

  function clearFilters() { setFilterEspecie(""); setFilterEstado(""); setSearch(""); }
  function openCreateModal() { setSelectedAnimal(null); setShowModal(true); }
  function openEditModal(animal: AnimalRow) { setSelectedAnimal(animal); setShowModal(true); }

  function handleSaved(animal: AnimalRow) {
    setAnimales((prev) => {
      const exists = prev.some((item) => item.id === animal.id);
      if (!exists) return [animal, ...prev];
      return prev.map((item) => (item.id === animal.id ? animal : item));
    });
    setSelectedAnimal(null);
    setShowModal(false);
  }

  async function handleDelete(animal: AnimalRow) {
    if (!window.confirm(`Eliminar el animal ${animal.identificador}?`)) return;
    setDeletingId(animal.id);
    setError(null);
    try {
      const { deleteAnimal } = await import("@/lib/api");
      await deleteAnimal(animal.id);
      setAnimales((prev) => prev.filter((item) => item.id !== animal.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="module-page animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <CowIcon size={30} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              Animales
            </h1>
            <p className="page-subtitle">
              {animales.length} {animales.length === 1 ? "animal" : "animales"} · {activos} activos
            </p>
          </div>
          <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
            <Plus size={16} /> Nuevo Animal
          </button>
        </div>

        {/* Search + Filters */}
        <div className="card" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 360 }}>
              <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-light)", pointerEvents: "none" }} />
              <input type="text" className="input" placeholder="Buscar por ID, categoría, raza..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.25rem" }} />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={() => setShowFilters((v) => !v)} style={{ color: hasFilters ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: hasFilters ? 600 : 400 }}>
                <Filter size={15} /> Filtros
                <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              {hasFilters && (
                <button className="btn btn-ghost" onClick={clearFilters} style={{ fontSize: "0.8125rem", color: "var(--color-error)" }}>
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--color-border)" }}>
              <div>
                <label className="label">Especie</label>
                <select value={filterEspecie} onChange={(e) => setFilterEspecie(e.target.value)} className="input" style={{ cursor: "pointer" }}>
                  <option value="">Todas</option>
                  {especieOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Estado</label>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="input" style={{ cursor: "pointer" }}>
                  <option value="">Todos</option>
                  {estadoOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="card animate-fade-in" style={{ background: "#fee2e2", border: "1px solid #fecaca", color: "var(--color-error)", textAlign: "center", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Error al cargar los animales</p>
            <p style={{ fontSize: "0.875rem", opacity: 0.85 }}>{error}</p>
          </div>
        )}

        {/* Record Cards */}
        {loading ? (
          <div className="record-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              {hasFilters ? (
                <>
                  <Filter className="empty-state-icon" size={48} />
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin resultados</p>
                  <p style={{ fontSize: "0.9rem" }}>Ningún animal coincide con los filtros.</p>
                  <button className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={clearFilters}><X size={14} /> Limpiar filtros</button>
                </>
              ) : (
                <>
                  <PackageOpen className="empty-state-icon" size={56} />
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin animales registrados</p>
                  <p style={{ fontSize: "0.9rem" }}>Registrá el primer animal para comenzar.</p>
                  <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={openCreateModal}><Plus size={14} /> Nuevo Animal</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Mostrando <strong style={{ color: "var(--color-primary-dark)" }}>{filtered.length}</strong>{" "}
                {hasFilters ? `de ${animales.length}` : filtered.length === 1 ? "animal" : "animales"}
              </p>
            </div>
            <div className="record-grid">
              {filtered.map((a) => (
                <div key={a.id} className="record-card animate-fade-in">
                  <div className="record-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CowIcon size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                      <span className="record-card-title">{a.identificador}</span>
                    </div>
                    <span className={ESTADO_BADGE[a.estado] ?? "badge"}>{a.estado}</span>
                  </div>
                  <div className="record-card-meta">
                    <span className="badge badge-gray">{a.especie}</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>·</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text)" }}>{a.categoria}</span>
                    {a.raza && (
                      <>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>·</span>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{a.raza}</span>
                      </>
                    )}
                  </div>
                  <div className="record-card-body">
                    <div className="record-card-field">
                      <span className="record-card-label">Sexo</span>
                      <span className="record-card-value">{a.sexo}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">Nacimiento</span>
                      <span className="record-card-value">{formatDate(a.fecha_nac)}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">Origen</span>
                      <span className="record-card-value">{a.origen}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">Lote</span>
                      <span className="record-card-value">{a.lote || "—"}</span>
                    </div>
                  </div>
                  <div className="record-card-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "0.8rem", color: "var(--color-primary)", padding: "0.25rem 0.5rem", gap: "0.35rem" }}
                      onClick={() => router.push(`/historial?animal=${a.id}`)}
                      title="Ver historial del animal"
                    >
                      <ClipboardList size={14} />
                      Historial
                    </button>
                    <RowActions onEdit={() => openEditModal(a)} onDelete={() => handleDelete(a)} deleting={deletingId === a.id} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB — mobile only */}
      <button className="fab" onClick={openCreateModal} aria-label="Nuevo Animal">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <AnimalModal
          initialData={selectedAnimal}
          onClose={() => { setSelectedAnimal(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
