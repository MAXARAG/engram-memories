"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Syringe, Plus, Filter, X, AlertTriangle, CheckCircle2, PackageOpen,
  ShieldAlert, CalendarDays, ChevronDown, Clock,
} from "lucide-react";
import type { AnimalRow, SanidadRow, SeguimientoRow } from "@/types/database";
import { SanidadModal } from "@/components/sanidad/SanidadModal";
import { RowActions } from "@/components/common/RowActions";
import { buildAnimalMap, getAnimalDisplayId } from "@/lib/animalReferences";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function diasRetiroRestantes(fechaStr: string, diasRetiro: number): number | null {
  if (!diasRetiro || diasRetiro <= 0) return null;
  const base = new Date(fechaStr + "T12:00:00");
  if (isNaN(base.getTime())) return null;
  const fin = new Date(base);
  fin.setDate(fin.getDate() + diasRetiro);
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const diff = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function fechaFinRetiro(fechaStr: string, diasRetiro: number): string {
  const base = new Date(fechaStr + "T12:00:00");
  if (isNaN(base.getTime())) return "";
  const fin = new Date(base);
  fin.setDate(fin.getDate() + diasRetiro);
  return fin.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Alerta Card (animal en retiro) ──────────────────────────────────────────

function AlertaCard({ animalLabel, registro, restantes }: { animalLabel: string; registro: SanidadRow; restantes: number }) {
  const urgente = restantes <= 3;
  return (
    <div className="animate-fade-in" style={{ background: urgente ? "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)" : "linear-gradient(135deg, #fffbeb 0%, #fef9ee 100%)", border: urgente ? "1.5px solid #f59e0b" : "1.5px solid #fcd34d", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: urgente ? "#f59e0b" : "#fcd34d", borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)" }} />
      <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: urgente ? "#fef3c7" : "#fef9ee", border: `1px solid ${urgente ? "#f59e0b" : "#fde68a"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertTriangle size={20} color={urgente ? "#b45309" : "#92400e"} />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "#78350f" }}>{animalLabel}</span>
          <span className="badge badge-amber" style={{ fontSize: "0.7rem" }}>{registro.especie}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "#dc2626", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
            <ShieldAlert size={11} /> No faenar
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "#92400e", marginTop: "0.25rem" }}>
          <strong>{registro.producto}</strong> · {registro.tratamiento}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.125rem", flexShrink: 0, minWidth: 80 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: urgente ? "#b45309" : "#92400e", lineHeight: 1 }}>{restantes}</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.04em" }}>{restantes === 1 ? "día" : "días"}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, minWidth: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <CalendarDays size={12} color="#92400e" />
          <span style={{ fontSize: "0.75rem", color: "#78350f", fontWeight: 600 }}>Libre el</span>
        </div>
        <span style={{ fontSize: "0.8125rem", color: "#78350f", fontWeight: 700, marginTop: "2px" }}>
          {fechaFinRetiro(registro.fecha, registro.dias_retiro)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SanidadPage() {
  const [records, setRecords] = useState<SanidadRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SanidadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [repeatBase, setRepeatBase] = useState<SanidadRow | null>(null);

  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterAnimal, setFilterAnimal] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getSanidad, getAnimales } = await import("@/lib/api");
        const [rows, animalRows] = await Promise.all([getSanidad(), getAnimales()]);
        if (cancelled) return;
        setRecords(rows);
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

  const enRetiro = useMemo(() => {
    return records
      .map((r) => ({ registro: r, restantes: diasRetiroRestantes(r.fecha, r.dias_retiro) }))
      .filter((x) => x.restantes !== null)
      .sort((a, b) => (a.restantes ?? 0) - (b.restantes ?? 0)) as Array<{ registro: SanidadRow; restantes: number }>;
  }, [records]);

  const animalMap = useMemo(() => buildAnimalMap(animals), [animals]);

  const especieOptions = useMemo(() => Array.from(new Set(records.map((r) => r.especie).filter(Boolean))).sort(), [records]);
  const tipoOptions = useMemo(() => Array.from(new Set(records.map((r) => r.tipo).filter(Boolean))).sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie && r.especie !== filterEspecie) return false;
      if (filterAnimal && !getAnimalDisplayId(animalMap, r.animal_id).toLowerCase().includes(filterAnimal.toLowerCase())) return false;
      if (filterTipo && r.tipo !== filterTipo) return false;
      if (filterDesde && r.fecha < filterDesde) return false;
      if (filterHasta && r.fecha > filterHasta) return false;
      return true;
    });
  }, [records, filterEspecie, filterAnimal, filterTipo, filterDesde, filterHasta, animalMap]);

  const hasFilters = !!(filterEspecie || filterAnimal || filterTipo || filterDesde || filterHasta);

  function clearFilters() { setFilterEspecie(""); setFilterAnimal(""); setFilterTipo(""); setFilterDesde(""); setFilterHasta(""); }

  function handleSaved(record: SanidadRow) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (!exists) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedRecord(null);
    setRepeatBase(null);
    setShowModal(false);
  }

  function openCreateModal() { setSelectedRecord(null); setShowModal(true); }
  function openEditModal(record: SanidadRow) { setSelectedRecord(record); setShowModal(true); }

  async function handleDelete(record: SanidadRow) {
    if (!window.confirm(`Eliminar el tratamiento de ${getAnimalDisplayId(animalMap, record.animal_id)}?`)) return;
    setDeletingId(record.id);
    setError(null);
    try {
      const { deleteSanidad } = await import("@/lib/api");
      await deleteSanidad(record.id);
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
                <Syringe size={20} />
              </div>
              <h1 className="page-title">Sanidad</h1>
            </div>
            <p className="page-subtitle">Tratamientos, vacunaciones y períodos de retiro</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)} style={{ position: "relative" }}>
              <Filter size={15} /> Filtros
              {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />}
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
              <Plus size={16} /> Nuevo Tratamiento
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

        {/* Historial */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Clock size={17} style={{ color: "var(--color-primary)" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>Historial</h2>
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
                <div><label className="label">ID Animal</label><input type="text" className="input" value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)} placeholder="Buscar ID..." /></div>
                <div><label className="label">Tipo</label><select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todos</option>{tipoOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
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
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin registros sanitarios</p>
                    <p style={{ fontSize: "0.9rem" }}>Usá <strong>Nuevo Tratamiento</strong> para agregar el primero.</p>
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
              {filtered.map((r, idx) => {
                const restantes = diasRetiroRestantes(r.fecha, r.dias_retiro);
                const enRetiroActivo = restantes !== null;
                const retiroCompletado = r.dias_retiro > 0 && !enRetiroActivo;

                return (
                  <div key={r.id ?? idx} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms`, borderLeftColor: enRetiroActivo ? "#f59e0b" : undefined, background: enRetiroActivo ? "linear-gradient(135deg, #fffbeb, #fff)" : undefined }}>
                    <div className="record-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Syringe size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                        <span className="record-card-title">{getAnimalDisplayId(animalMap, r.animal_id)}</span>
                      </div>
                      {enRetiroActivo ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                          <AlertTriangle size={10} /> Retiro ({restantes}d)
                        </span>
                      ) : retiroCompletado ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "#dcfce7", color: "#166534", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                          <CheckCircle2 size={10} /> Completado
                        </span>
                      ) : (
                        <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>Sin retiro</span>
                      )}
                    </div>
                    <div className="record-card-meta">
                      <span className="badge badge-green">{r.especie}</span>
                      <span className="badge badge-blue">{r.tipo}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{formatDate(r.fecha)}</span>
                    </div>
                    <div className="record-card-body">
                      <div className="record-card-field">
                        <span className="record-card-label">Tratamiento</span>
                        <span className="record-card-value">{r.tratamiento}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Producto</span>
                        <span className="record-card-value">{r.producto || "—"}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Dosis</span>
                        <span className="record-card-value">{r.dosis || "—"}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Retiro</span>
                        <span className="record-card-value">{r.dias_retiro > 0 ? `${r.dias_retiro} días` : "—"}</span>
                      </div>
                      {r.proxima_fecha && (
                        <div className="record-card-field">
                          <span className="record-card-label">Próxima dosis</span>
                          <span className="record-card-value" style={{ color: "#2563eb", fontWeight: 600 }}>{formatDate(r.proxima_fecha)}</span>
                        </div>
                      )}
                    </div>
                    <div className="record-card-actions" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "0.375rem" }}>
                      <RowActions onEdit={() => openEditModal(r)} onDelete={() => handleDelete(r)} deleting={deletingId === r.id} />
                    </div>
                  </div>
                );
              })}
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
      <button className="fab" onClick={openCreateModal} aria-label="Nuevo Tratamiento">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <SanidadModal
          animals={animals}
          initialData={selectedRecord}
          onClose={() => { setSelectedRecord(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
