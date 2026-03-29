"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Filter, X, PackageOpen, ChevronDown, Clock,
} from "lucide-react";
import { RowActions } from "@/components/common/RowActions";
import { buildAnimalMap, getAnimalDisplayId } from "@/lib/animalReferences";
import type { AnimalRow, DesteteRow, DestinoDestete } from "@/types";
import { DesteteModal } from "@/components/destete/DesteteModal";
import { CalfIcon } from "@/components/icons/CalfIcon";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : null;
  if (!d || isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatKg(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " kg";
}

const DESTINO_BADGE: Record<DestinoDestete, string> = {
  Recría: "badge-green", Venta: "badge-blue", Engorde: "badge-amber",
};

const DESTINO_LIST: DestinoDestete[] = ["Recría", "Venta", "Engorde"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DestetePage() {
  const [records, setRecords] = useState<DesteteRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DesteteRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterDestino, setFilterDestino] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getDestete, getAnimales } = await import("@/lib/api");
        const [data, animalRows] = await Promise.all([getDestete(), getAnimales()]);
        if (cancelled) return;
        setRecords(data);
        setAnimals(animalRows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const especieOptions = useMemo(() => Array.from(new Set(records.map((r) => r.especie))).sort(), [records]);
  const animalMap = useMemo(() => buildAnimalMap(animals), [animals]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie && r.especie !== filterEspecie) return false;
      if (filterDestino && r.destino !== filterDestino) return false;
      if (filterDesde && r.fecha < filterDesde) return false;
      if (filterHasta && r.fecha > filterHasta) return false;
      return true;
    });
  }, [records, filterEspecie, filterDestino, filterDesde, filterHasta]);

  const hasFilters = !!(filterEspecie || filterDestino || filterDesde || filterHasta);

  function clearFilters() { setFilterEspecie(""); setFilterDestino(""); setFilterDesde(""); setFilterHasta(""); }

  function handleSaved(record: DesteteRow) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (!exists) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedRecord(null);
    setShowModal(false);
  }

  function openCreateModal() { setSelectedRecord(null); setShowModal(true); }
  function openEditModal(record: DesteteRow) { setSelectedRecord(record); setShowModal(true); }

  async function handleDelete(record: DesteteRow) {
    if (!window.confirm(`Eliminar el destete de ${getAnimalDisplayId(animalMap, record.cria_id)}?`)) return;
    setDeletingId(record.id);
    setError(null);
    try {
      const { deleteDestete } = await import("@/lib/api");
      await deleteDestete(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div style={{ background: "var(--color-primary-muted)", borderRadius: "var(--radius-md)", padding: "0.375rem", display: "flex", color: "var(--color-primary)" }}>
                <CalfIcon size={20} />
              </div>
              <h1 className="page-title">Destete</h1>
            </div>
            <p className="page-subtitle">Historial de destetes por especie, lote y destino</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)} style={{ position: "relative" }}>
              <Filter size={15} /> Filtros
              {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />}
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
              <Plus size={16} /> Registrar Destete
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in" style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", color: "var(--color-error)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <X size={18} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: "0.9375rem" }}>{error}</p>
          </div>
        )}

        {/* Registros */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Clock size={17} style={{ color: "var(--color-primary)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>Registros</h2>
              {!loading && !error && <span className="count-badge">{filtered.length}{hasFilters && ` / ${records.length}`}</span>}
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
                <div><label className="label">Especie</label><select className="input" value={filterEspecie} onChange={(e) => setFilterEspecie(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todas</option>{especieOptions.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
                <div><label className="label">Destino</label><select className="input" value={filterDestino} onChange={(e) => setFilterDestino(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todos</option>{DESTINO_LIST.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
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
                  <div className="skeleton-bar" style={{ width: "50%", marginBottom: "0.75rem" }} />
                  <div className="skeleton-bar" style={{ width: "80%", marginBottom: "0.5rem" }} />
                  <div className="skeleton-bar" style={{ width: "60%" }} />
                </div>
              ))}
            </div>
          ) : !error && filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                {records.length === 0 ? (
                  <>
                    <PackageOpen className="empty-state-icon" size={56} />
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin registros de destete</p>
                    <p style={{ fontSize: "0.9rem" }}>Usá <strong>Registrar Destete</strong> para agregar el primero.</p>
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
              {filtered.map((r, idx) => (
                <div key={r.id ?? idx} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                  <div className="record-card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CalfIcon size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                      <span className="record-card-title">{getAnimalDisplayId(animalMap, r.cria_id)}</span>
                    </div>
                    <span className={`badge ${DESTINO_BADGE[r.destino]}`}>{r.destino}</span>
                  </div>
                  <div className="record-card-meta">
                    <span className="badge badge-green">{r.especie}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{formatDate(r.fecha)}</span>
                  </div>
                  <div className="record-card-body">
                    <div className="record-card-field">
                      <span className="record-card-label">Madre</span>
                      <span className="record-card-value">{getAnimalDisplayId(animalMap, r.madre_id)}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">N° Crías</span>
                      <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-primary-dark)" }}>{r.n_crias}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">Peso Total</span>
                      <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-primary-dark)" }}>{formatKg(r.peso_total)}</span>
                    </div>
                    <div className="record-card-field">
                      <span className="record-card-label">Promedio</span>
                      <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-accent)" }}>{formatKg(r.peso_promedio)}</span>
                    </div>
                  </div>
                  <div className="record-card-actions">
                    <RowActions onEdit={() => openEditModal(r)} onDelete={() => handleDelete(r)} deleting={deletingId === r.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-light)", marginTop: "0.75rem", textAlign: "right" }}>
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"}{hasFilters && ` (de ${records.length})`}
            </p>
          )}
        </section>
      </div>

      {/* FAB */}
      <button className="fab" onClick={openCreateModal} aria-label="Registrar Destete">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <DesteteModal
          animals={animals}
          initialData={selectedRecord}
          onClose={() => { setSelectedRecord(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
