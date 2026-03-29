"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Heart, Plus, Filter, X, PackageOpen, AlertTriangle, Calendar,
  ChevronDown, Syringe, Clock,
} from "lucide-react";
import type { AnimalRow, ReproduccionRow } from "@/types/database";
import { RowActions } from "@/components/common/RowActions";
import { ReproduccionModal } from "@/components/reproduccion/ReproduccionModal";
import { buildAnimalMap, getAnimalDisplayId } from "@/lib/animalReferences";
import { CalfIcon } from "@/components/icons/CalfIcon";

// ─── Constants ────────────────────────────────────────────────────────────────

const GESTACION_DIAS: Record<string, number> = {
  Bovino: 280, Ovino: 150, Porcino: 114, Caprino: 150, Otro: 280,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
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
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function estimatedParto(r: ReproduccionRow): Date | null {
  const serviceDate = new Date(r.fecha_servicio + "T12:00:00");
  if (isNaN(serviceDate.getTime())) return null;
  const dias = GESTACION_DIAS[r.especie] ?? 280;
  return addDaysToDate(serviceDate, dias);
}

function getEstado(r: ReproduccionRow): "Parida" | "Preñada" | "Pendiente" {
  if (r.fecha_parto && r.n_crias > 0) return "Parida";
  if (r.diagnostico === "Positivo") return "Preñada";
  return "Pendiente";
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: string }) {
  return tipo === "Natural" ? (
    <span className="badge badge-green" style={{ gap: "0.3rem" }}><Heart size={10} /> Natural</span>
  ) : (
    <span className="badge badge-blue" style={{ gap: "0.3rem" }}><Syringe size={10} /> Inseminación</span>
  );
}

function DiagnosticoBadge({ diagnostico }: { diagnostico: string }) {
  const map: Record<string, string> = { Positivo: "badge-green", Negativo: "badge-red", Pendiente: "badge-amber", "No realizado": "badge-gray" };
  return <span className={`badge ${map[diagnostico] ?? "badge-gray"}`}>{diagnostico}</span>;
}

function EstadoBadge({ estado }: { estado: ReturnType<typeof getEstado> }) {
  if (estado === "Parida") return <span className="badge badge-green">Parida</span>;
  if (estado === "Preñada") return <span className="badge badge-amber">Preñada</span>;
  return <span className="badge badge-gray">Pendiente</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReproduccionPage() {
  const [records, setRecords] = useState<ReproduccionRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReproduccionRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterIdMadre, setFilterIdMadre] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { getReproduccion, getAnimales } = await import("@/lib/api");
        const [rows, animalRows] = await Promise.all([getReproduccion(), getAnimales()]);
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

  const today = useMemo(() => new Date(), []);
  const animalMap = useMemo(() => buildAnimalMap(animals), [animals]);

  // Próximos partos (next 30 days)
  const proximosPartos = useMemo(() => {
    if (loading) return [];
    return records
      .filter((r) => {
        if (r.fecha_parto && r.n_crias > 0) return false;
        const ep = estimatedParto(r);
        if (!ep) return false;
        const dias = diffDays(ep, today);
        return dias >= 0 && dias <= 30;
      })
      .map((r) => ({ r, ep: estimatedParto(r)!, diasRestantes: diffDays(estimatedParto(r)!, today) }))
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [records, loading, today]);

  const especieOptions = useMemo(() => Array.from(new Set(records.map((r) => r.especie))).sort(), [records]);
  const hasFilters = !!(filterEspecie || filterTipo || filterIdMadre || filterDesde || filterHasta);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterEspecie && r.especie !== filterEspecie) return false;
      if (filterTipo && r.tipo_servicio !== filterTipo) return false;
      if (filterIdMadre && !getAnimalDisplayId(animalMap, r.animal_id).toLowerCase().includes(filterIdMadre.toLowerCase())) return false;
      if (filterDesde && r.fecha_servicio < filterDesde) return false;
      if (filterHasta && r.fecha_servicio > filterHasta) return false;
      return true;
    });
  }, [records, filterEspecie, filterTipo, filterIdMadre, filterDesde, filterHasta, animalMap]);

  function clearFilters() { setFilterEspecie(""); setFilterTipo(""); setFilterIdMadre(""); setFilterDesde(""); setFilterHasta(""); }

  function handleSaved(record: ReproduccionRow) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (!exists) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedRecord(null);
    setShowModal(false);
  }

  function openCreateModal() { setSelectedRecord(null); setShowModal(true); }
  function openEditModal(record: ReproduccionRow) { setSelectedRecord(record); setShowModal(true); }

  async function handleDelete(record: ReproduccionRow) {
    if (!window.confirm(`Eliminar el servicio de ${getAnimalDisplayId(animalMap, record.animal_id)}?`)) return;
    setDeletingId(record.id);
    setError(null);
    try {
      const { deleteReproduccion } = await import("@/lib/api");
      await deleteReproduccion(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(185,28,28,0); }
        }
      `}</style>

      <div className="module-page animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div style={{ background: "var(--color-primary-muted)", borderRadius: "var(--radius-md)", padding: "0.375rem", display: "flex", color: "var(--color-primary)" }}>
                <Heart size={20} />
              </div>
              <h1 className="page-title">Reproducción</h1>
            </div>
            <p className="page-subtitle">Servicios, gestaciones y partos del rodeo</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)} style={{ position: "relative" }}>
              <Filter size={15} /> Filtros
              {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />}
              <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
              <Plus size={16} /> Nuevo Servicio
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

        {/* ── Partos próximos (operational section — keep) ── */}
        {!loading && !error && (
          <section style={{ marginBottom: "2rem" }}>
            <div style={{
              background: "linear-gradient(135deg, #1e3d1a 0%, #2d5a27 60%, #3d7a35 100%)",
              borderRadius: "var(--radius-xl)",
              padding: "1.5rem",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "var(--shadow-lg)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 80% 20%, rgba(139,105,20,0.18) 0%, transparent 60%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem", position: "relative" }}>
                <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)", padding: "0.5rem", display: "flex" }}>
                  <CalfIcon size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>Partos próximos</h2>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "1px" }}>Hembras con parto estimado en los próximos 30 días</p>
                </div>
                {proximosPartos.length > 0 && (
                  <span style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.8rem", fontWeight: 700, borderRadius: 999, padding: "0.2rem 0.75rem", flexShrink: 0 }}>
                    {proximosPartos.length} {proximosPartos.length === 1 ? "hembra" : "hembras"}
                  </span>
                )}
              </div>

              {proximosPartos.length === 0 ? (
                <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem", textAlign: "center", gap: "0.625rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Heart size={22} color="rgba(255,255,255,0.5)" />
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Sin partos próximos</p>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>No hay hembras con parto esperado en los próximos 30 días</p>
                </div>
              ) : (
                <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
                  {proximosPartos.map(({ r, ep, diasRestantes }) => {
                    const urgente = diasRestantes <= 7;
                    return (
                      <div key={r.id ?? r.animal_id} className="animate-fade-in" style={{
                        background: urgente ? "rgba(185,28,28,0.12)" : "rgba(255,255,255,0.1)",
                        border: urgente ? "1.5px solid rgba(185,28,28,0.45)" : "1px solid rgba(255,255,255,0.18)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.875rem 1rem",
                        backdropFilter: "blur(4px)",
                        animation: urgente ? "fadeIn 0.3s ease both, pulse-border 2s ease-in-out 0.3s infinite" : "fadeIn 0.3s ease both",
                        position: "relative",
                      }}>
                        {urgente && (
                          <span style={{ position: "absolute", top: "0.625rem", right: "0.625rem", background: "#b91c1c", color: "#fff", fontSize: "0.675rem", fontWeight: 700, borderRadius: 999, padding: "0.175rem 0.55rem", display: "flex", alignItems: "center", gap: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            <AlertTriangle size={10} /> Urgente
                          </span>
                        )}
                        <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: urgente ? "#fca5a5" : "#fff", letterSpacing: "0.01em", marginBottom: "1px" }}>
                          {getAnimalDisplayId(animalMap, r.animal_id)}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", marginBottom: "0.5rem" }}>{r.especie}</p>
                        <div style={{ marginBottom: "0.625rem" }}><TipoBadge tipo={r.tipo_servicio} /></div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
                          <Calendar size={12} color="rgba(255,255,255,0.45)" />
                          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Servicio: {formatDate(r.fecha_servicio)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <CalfIcon size={12} color="rgba(255,255,255,0.45)" />
                          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>Parto est.: {formatDateObj(ep)}</span>
                        </div>
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                          <span style={{ display: "inline-block", background: urgente ? "rgba(185,28,28,0.5)" : "rgba(255,255,255,0.15)", color: urgente ? "#fca5a5" : "rgba(255,255,255,0.9)", fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 700, borderRadius: 999, padding: "0.2rem 0.75rem" }}>
                            {diasRestantes === 0 ? "¡Hoy!" : `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Historial completo ── */}
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
                <div><label className="label">ID Madre</label><input type="text" className="input" value={filterIdMadre} onChange={(e) => setFilterIdMadre(e.target.value)} placeholder="Buscar ID..." /></div>
                <div><label className="label">Especie</label><select className="input" value={filterEspecie} onChange={(e) => setFilterEspecie(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todas</option>{especieOptions.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
                <div><label className="label">Tipo Servicio</label><select className="input" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} style={{ cursor: "pointer" }}><option value="">Todos</option><option value="Natural">Natural</option><option value="Inseminación">Inseminación</option></select></div>
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
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin registros reproductivos</p>
                    <p style={{ fontSize: "0.9rem" }}>Usá <strong>Nuevo Servicio</strong> para agregar el primero.</p>
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
                const estado = getEstado(r);
                return (
                  <div key={r.id ?? idx} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                    <div className="record-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Heart size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                        <span className="record-card-title">{getAnimalDisplayId(animalMap, r.animal_id)}</span>
                      </div>
                      <EstadoBadge estado={estado} />
                    </div>
                    <div className="record-card-meta">
                      <span className="badge badge-green">{r.especie}</span>
                      <TipoBadge tipo={r.tipo_servicio} />
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{formatDate(r.fecha_servicio)}</span>
                    </div>
                    <div className="record-card-body">
                      <div className="record-card-field">
                        <span className="record-card-label">Macho</span>
                        <span className="record-card-value">{r.macho ?? "—"}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Diagnóstico</span>
                        <span className="record-card-value"><DiagnosticoBadge diagnostico={r.diagnostico ?? ""} /></span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Fecha Parto</span>
                        <span className="record-card-value">{r.fecha_parto ? formatDate(r.fecha_parto) : "—"}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Crías</span>
                        <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: r.n_crias > 0 ? "var(--color-primary-dark)" : "var(--color-text-light)" }}>{r.n_crias > 0 ? r.n_crias : "—"}</span>
                      </div>
                    </div>
                    <div className="record-card-actions">
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
      <button className="fab" onClick={openCreateModal} aria-label="Nuevo Servicio">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {showModal && (
        <ReproduccionModal
          animals={animals}
          initialData={selectedRecord}
          onClose={() => { setSelectedRecord(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
