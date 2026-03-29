"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign, Plus, Building2, TrendingUp, Filter, X, PackageOpen,
  ChevronDown, Clock,
} from "lucide-react";
import type { CostoRow, TipoCosto } from "@/types";
import { CostoModal } from "@/components/costos/CostoModal";
import { RowActions } from "@/components/common/RowActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(value: number): string {
  return value.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CostosPage() {
  const [costos, setCostos] = useState<CostoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CostoRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterTipo, setFilterTipo] = useState<"" | TipoCosto>("");
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadCostos = useCallback(async () => {
    setLoading(true);
    try {
      const { getCostos } = await import("@/lib/api");
      const data = await getCostos();
      setCostos(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCostos(); }, [loadCostos]);

  const especiesDisponibles = useMemo(() => Array.from(new Set(costos.map((c) => c.especie || "General"))).sort(), [costos]);
  const categoriasDisponibles = useMemo(() => Array.from(new Set(costos.map((c) => c.categoria))).sort(), [costos]);

  const costosFiltrados = useMemo(() => {
    return costos.filter((c) => {
      if (filterTipo && c.tipo !== filterTipo) return false;
      if (filterEspecie && (c.especie || "General") !== filterEspecie) return false;
      if (filterCategoria && c.categoria !== filterCategoria) return false;
      if (filterDesde) {
        const d = new Date(c.fecha + "T12:00:00");
        if (isNaN(d.getTime()) || d < new Date(filterDesde + "T00:00:00")) return false;
      }
      if (filterHasta) {
        const d = new Date(c.fecha + "T12:00:00");
        if (isNaN(d.getTime()) || d > new Date(filterHasta + "T23:59:59")) return false;
      }
      return true;
    });
  }, [costos, filterTipo, filterEspecie, filterCategoria, filterDesde, filterHasta]);

  const hasFilters = !!(filterTipo || filterEspecie || filterCategoria || filterDesde || filterHasta);

  function clearFilters() { setFilterTipo(""); setFilterEspecie(""); setFilterCategoria(""); setFilterDesde(""); setFilterHasta(""); }

  function handleSaved(record: CostoRow) {
    setCostos((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (!exists) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedRecord(null);
    setShowModal(false);
  }

  function openCreateModal() { setSelectedRecord(null); setShowModal(true); }
  function openEditModal(record: CostoRow) { setSelectedRecord(record); setShowModal(true); }

  async function handleDelete(record: CostoRow) {
    if (!window.confirm(`Eliminar el costo "${record.concepto}"?`)) return;
    setDeletingId(record.id);
    try {
      const { deleteCosto } = await import("@/lib/api");
      await deleteCosto(record.id);
      setCostos((prev) => prev.filter((item) => item.id !== record.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo eliminar el costo.");
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div style={{ background: "var(--color-accent-muted)", borderRadius: "var(--radius-md)", padding: "0.375rem", display: "flex", color: "var(--color-accent)" }}>
                <DollarSign size={20} />
              </div>
              <h1 className="page-title">Costos</h1>
            </div>
            <p className="page-subtitle">Registro de gastos del establecimiento</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)} style={{ position: "relative" }}>
              <Filter size={15} /> Filtros
              {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />}
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <button className="btn btn-primary hide-mobile" onClick={openCreateModal} style={{ background: "var(--color-accent)" }}>
              <Plus size={16} /> Registrar Costo
            </button>
          </div>
        </div>

        {/* Registros */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Clock size={17} style={{ color: "var(--color-accent)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>Registros</h2>
              {!loading && <span className="count-badge">{costosFiltrados.length}{hasFilters && ` / ${costos.length}`}</span>}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="card animate-fade-in" style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filtros</p>
                {hasFilters && <button className="btn btn-ghost" onClick={clearFilters} style={{ fontSize: "0.8125rem" }}><X size={13} /> Limpiar</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.875rem" }}>
                <div><label className="label">Tipo</label><select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as "" | TipoCosto)} style={{ cursor: "pointer" }}><option value="">Todos</option><option value="Fijo">Fijo</option><option value="Variable">Variable</option></select></div>
                <div><label className="label">Especie</label><select className="input" value={filterEspecie} onChange={(e) => setFilterEspecie(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todas</option>{especiesDisponibles.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
                <div><label className="label">Categoría</label><select className="input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todas</option>{categoriasDisponibles.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label">Desde</label><input type="date" className="input" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} /></div>
                <div><label className="label">Hasta</label><input type="date" className="input" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Record Cards */}
          {loading ? (
            <div className="record-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-bar" style={{ width: "60%", marginBottom: "0.75rem" }} />
                  <div className="skeleton-bar" style={{ width: "80%", marginBottom: "0.5rem" }} />
                  <div className="skeleton-bar" style={{ width: "40%" }} />
                </div>
              ))}
            </div>
          ) : costosFiltrados.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                {costos.length === 0 ? (
                  <>
                    <PackageOpen className="empty-state-icon" size={56} />
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin registros de costos</p>
                    <p style={{ fontSize: "0.9rem" }}>Usá <strong>Registrar Costo</strong> para agregar el primero.</p>
                  </>
                ) : (
                  <>
                    <Filter className="empty-state-icon" size={48} />
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin resultados</p>
                    <button className="btn btn-secondary" style={{ marginTop: "0.75rem" }} onClick={clearFilters}><X size={14} /> Limpiar filtros</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="record-grid">
              {costosFiltrados.map((c, idx) => (
                <div key={c.id ?? idx} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                  <div className="record-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <DollarSign size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
                      <span className="record-card-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.concepto}</span>
                    </div>
                    {c.tipo === "Fijo" ? (
                      <span className="badge badge-blue" style={{ gap: "0.3rem", flexShrink: 0 }}><Building2 size={10} /> Fijo</span>
                    ) : (
                      <span className="badge" style={{ background: "#ffedd5", color: "#c2410c", gap: "0.3rem", flexShrink: 0 }}><TrendingUp size={10} /> Variable</span>
                    )}
                  </div>
                  <div className="record-card-meta">
                    <span style={{ fontSize: "0.8rem", background: "var(--color-primary-muted)", color: "var(--color-primary-dark)", borderRadius: 999, padding: "0.15rem 0.6rem", fontWeight: 500 }}>{c.especie || "General"}</span>
                    <span className="badge badge-gray">{c.categoria}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{formatDate(c.fecha)}</span>
                  </div>
                  <div className="record-card-body" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="record-card-field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="record-card-label">Monto</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", color: "var(--color-accent)" }}>$ {formatMoney(c.monto)}</span>
                    </div>
                  </div>
                  <div className="record-card-actions">
                    <RowActions onEdit={() => openEditModal(c)} onDelete={() => handleDelete(c)} deleting={deletingId === c.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && costosFiltrados.length > 0 && (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-light)", marginTop: "0.75rem", textAlign: "right" }}>
              {costosFiltrados.length} {costosFiltrados.length === 1 ? "registro" : "registros"}{hasFilters && ` (de ${costos.length})`}
            </p>
          )}
        </section>
      </div>

      {/* FAB */}
      <button className="fab" onClick={openCreateModal} aria-label="Registrar Costo" style={{ background: "var(--color-accent)" }}>
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <CostoModal
          initialData={selectedRecord}
          onClose={() => { setSelectedRecord(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
