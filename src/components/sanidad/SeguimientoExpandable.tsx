"use client";

import { useState, useEffect } from "react";
import {
  Activity, Plus, Trash2, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Thermometer, Weight, CalendarDays,
} from "lucide-react";
import type { SanidadRow, SeguimientoRow } from "@/types/database";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_OPTIONS = [
  { value: "mejorado",    label: "Mejoró",      icon: TrendingUp,   color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  { value: "en_curso",    label: "En curso",    icon: Minus,        color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  { value: "sin_cambios", label: "Estable",     icon: Minus,        color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  { value: "empeoro",     label: "Empeoró",     icon: TrendingDown, color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  { value: "completado",  label: "Completado",  icon: CheckCircle2, color: "#166534", bg: "#dcfce7", border: "#86efac" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function diasParaProxima(proxima_fecha: string | null | undefined): number | null {
  if (!proxima_fecha) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fp  = new Date(proxima_fecha + "T12:00:00"); fp.setHours(0, 0, 0, 0);
  return Math.round((fp.getTime() - hoy.getTime()) / 86_400_000);
}

function getEstadoConfig(estado: string) {
  return ESTADO_OPTIONS.find((o) => o.value === estado) ?? ESTADO_OPTIONS[1];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SeguimientoExpandableProps {
  sanidad: SanidadRow;
  onClose?: () => void;
  onRepetir?: (base: SanidadRow, ultimoSeguimiento: SeguimientoRow | null) => void;
}

interface FormState {
  fecha: string;
  temperatura: string;
  peso: string;
  estado: string;
  observaciones: string;
}

function initForm(): FormState {
  return {
    fecha: new Date().toISOString().split("T")[0],
    temperatura: "",
    peso: "",
    estado: "en_curso",
    observaciones: "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SeguimientoExpandable({ sanidad, onClose }: SeguimientoExpandableProps) {
  const [seguimientos, setSeguimientos] = useState<SeguimientoRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [form, setForm]                 = useState<FormState>(initForm());
  const [showForm, setShowForm]         = useState(false);

  const diasRestantes = diasParaProxima(sanidad.proxima_fecha);

  // Cargar seguimientos al montar
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { getSeguimientos } = await import("@/lib/api");
        const rows = await getSeguimientos(sanidad.id);
        if (!cancelled) setSeguimientos(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sanidad.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.estado) return setError("Seleccioná el estado del animal.");
    setSaving(true);
    setError(null);
    try {
      const { addSeguimiento } = await import("@/lib/api");
      const nuevo = await addSeguimiento({
        sanidad_id:    sanidad.id,
        fecha:         form.fecha,
        temperatura:   form.temperatura ? parseFloat(form.temperatura) : null,
        peso:          form.peso ? parseFloat(form.peso) : null,
        estado:        form.estado,
        observaciones: form.observaciones.trim() || null,
      });
      setSeguimientos((prev) => [nuevo, ...prev]);
      setForm(initForm());
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este seguimiento?")) return;
    setDeletingId(id);
    try {
      const { deleteSeguimiento } = await import("@/lib/api");
      await deleteSeguimiento(id);
      setSeguimientos((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Error al eliminar.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Alerta próxima dosis ── */}
      {sanidad.proxima_fecha && diasRestantes !== null && diasRestantes <= 7 && (
        <div style={{
          background: diasRestantes <= 0 ? "#fee2e2" : "#fff7ed",
          border: `1.5px solid ${diasRestantes <= 0 ? "#fca5a5" : "#fed7aa"}`,
          borderRadius: "var(--radius-lg)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
        }}>
          <AlertTriangle size={16} style={{ color: diasRestantes <= 0 ? "#dc2626" : "#ea580c", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: diasRestantes <= 0 ? "#991b1b" : "#9a3412" }}>
              {diasRestantes <= 0 ? "¡Próxima dosis HOY!" : `Próxima dosis en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
            </p>
            <p style={{ fontSize: "0.75rem", color: diasRestantes <= 0 ? "#b91c1c" : "#7c2d12", marginTop: "1px" }}>
              {formatDate(sanidad.proxima_fecha)}
            </p>
          </div>
        </div>
      )}

      {/* ── Historial ── */}
      <div>
        {/* Sub-header del historial */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Activity size={13} style={{ color: "var(--color-text-muted)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Historial
            </span>
            {!loading && seguimientos.length > 0 && (
              <span style={{ fontSize: "0.7rem", background: "var(--color-border)", color: "var(--color-text-muted)", borderRadius: 999, padding: "0.05rem 0.4rem", fontWeight: 700 }}>
                {seguimientos.length}
              </span>
            )}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[1, 2].map((i) => <div key={i} className="skeleton-card" style={{ height: 60 }} />)}
          </div>
        ) : seguimientos.length === 0 && !showForm ? (
          <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--color-text-muted)", background: "var(--color-bg)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--color-border)" }}>
            <Activity size={24} style={{ opacity: 0.25, marginBottom: "0.375rem" }} />
            <p style={{ fontSize: "0.8125rem" }}>Sin registros aún</p>
            <p style={{ fontSize: "0.75rem", marginTop: "0.2rem", opacity: 0.75 }}>Agregá el primer seguimiento</p>
          </div>
        ) : (
          /* Timeline */
          <div style={{ position: "relative", paddingLeft: "1.125rem" }}>
            {/* Línea vertical */}
            {seguimientos.length > 1 && (
              <div style={{ position: "absolute", left: "0.3125rem", top: 8, bottom: 8, width: 1.5, background: "var(--color-border)", borderRadius: 999 }} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {seguimientos.map((seg, idx) => {
                const cfg = getEstadoConfig(seg.estado);
                const Icon = cfg.icon;
                const isFirst = idx === 0;
                return (
                  <div key={seg.id} style={{ position: "relative" }}>
                    {/* Dot en la línea */}
                    <div style={{
                      position: "absolute", left: "-1.125rem", top: "0.625rem",
                      width: 11, height: 11, borderRadius: "50%",
                      background: isFirst ? cfg.color : "var(--color-bg-card)",
                      border: `2px solid ${cfg.color}`,
                      flexShrink: 0,
                      zIndex: 1,
                    }} />

                    <div style={{
                      background: isFirst ? cfg.bg : "var(--color-bg-card)",
                      border: `1px solid ${isFirst ? cfg.border : "var(--color-border)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "0.625rem 0.75rem",
                      position: "relative",
                    }}>
                      {/* Fila superior: estado + fecha + delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: (seg.temperatura != null || seg.peso != null || seg.observaciones) ? "0.375rem" : 0 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `1.5px solid ${cfg.color}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={11} style={{ color: cfg.color }} />
                        </div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: cfg.color, flex: 1 }}>
                          {cfg.label}
                          {isFirst && (
                            <span style={{ marginLeft: "0.4rem", fontSize: "0.6rem", fontWeight: 700, background: cfg.color, color: "#fff", padding: "0.05rem 0.35rem", borderRadius: 999, verticalAlign: "middle" }}>
                              ÚLTIMO
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.2rem", flexShrink: 0 }}>
                          <CalendarDays size={10} /> {formatDate(seg.fecha)}
                        </span>
                        <button
                          onClick={() => handleDelete(seg.id)}
                          disabled={deletingId === seg.id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.1rem", display: "flex", opacity: 0.4, flexShrink: 0 }}
                          title="Eliminar"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Datos vitales */}
                      {(seg.temperatura != null || seg.peso != null) && (
                        <div style={{ display: "flex", gap: "0.875rem", marginBottom: seg.observaciones ? "0.3rem" : 0 }}>
                          {seg.temperatura != null && (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 500 }}>
                              <Thermometer size={12} style={{ color: "#7c3aed" }} />
                              {seg.temperatura} °C
                            </span>
                          )}
                          {seg.peso != null && (
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 500 }}>
                              <Weight size={12} style={{ color: "#7c3aed" }} />
                              {seg.peso} kg
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observaciones */}
                      {seg.observaciones && (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", lineHeight: 1.45, marginTop: "0.25rem" }}>
                          &ldquo;{seg.observaciones}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Próxima dosis (info, fuera del rango urgente) ── */}
      {sanidad.proxima_fecha && (diasRestantes === null || diasRestantes > 7) && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-lg)" }}>
          <CalendarDays size={13} style={{ color: "#2563eb", flexShrink: 0 }} />
          <p style={{ fontSize: "0.8rem", color: "#1e40af" }}>
            Próxima dosis: <strong>{formatDate(sanidad.proxima_fecha)}</strong>
          </p>
        </div>
      )}

      {/* ── Botón / Formulario ── */}
      {!showForm ? (
        <button
          className="btn btn-secondary"
          style={{ justifyContent: "center", fontSize: "0.8125rem", borderColor: "#c4b5fd", color: "#7c3aed", borderStyle: "dashed" }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={14} /> Registrar seguimiento
        </button>
      ) : (
        <div style={{ border: "1.5px solid #c4b5fd", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>

          {/* Header del form */}
          <div style={{ background: "linear-gradient(135deg, #ede9fe, #f5f3ff)", padding: "0.625rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Nuevo seguimiento
            </span>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(initForm()); setError(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: "0.75rem" }}
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSave} style={{ padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>

            {/* 1. Estado del animal — lo más importante, primero y grande */}
            <div>
              <label className="label" style={{ marginBottom: "0.5rem" }}>Estado del animal <span style={{ color: "var(--color-error)" }}>*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                {ESTADO_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const sel = form.estado === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, estado: opt.value }))}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
                        fontSize: "0.8125rem",
                        padding: "0.5rem 0.625rem",
                        borderRadius: "var(--radius-md)",
                        border: sel ? `2px solid ${opt.color}` : `1.5px solid ${opt.border}`,
                        background: sel ? opt.bg : "var(--color-bg)",
                        color: sel ? opt.color : "var(--color-text-muted)",
                        fontWeight: sel ? 700 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon size={13} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Fecha */}
            <div>
              <label className="label">Fecha del seguimiento</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="input" required />
            </div>

            {/* 3. Temperatura + Peso */}
            <div>
              <label className="label" style={{ marginBottom: "0.5rem" }}>Datos vitales <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--color-text-light)" }}>(opcional)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                <div style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#7c3aed", display: "flex", alignItems: "center", gap: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <Thermometer size={11} /> Temp.
                  </label>
                  <input
                    type="number" name="temperatura" value={form.temperatura} onChange={handleChange}
                    className="input"
                    style={{ border: "none", padding: "0", fontSize: "1rem", fontWeight: 600, background: "transparent", outline: "none" }}
                    placeholder="38.5" min="30" max="45" step="0.1"
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>°C</span>
                </div>
                <div style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#7c3aed", display: "flex", alignItems: "center", gap: "0.25rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <Weight size={11} /> Peso
                  </label>
                  <input
                    type="number" name="peso" value={form.peso} onChange={handleChange}
                    className="input"
                    style={{ border: "none", padding: "0", fontSize: "1rem", fontWeight: 600, background: "transparent", outline: "none" }}
                    placeholder="320" min="0" step="0.1"
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>kg</span>
                </div>
              </div>
            </div>

            {/* 4. Observaciones */}
            <div>
              <label className="label">Observaciones <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "var(--color-text-light)" }}>(opcional)</span></label>
              <textarea
                name="observaciones" value={form.observaciones} onChange={handleChange}
                className="input"
                placeholder="Evolución, síntomas, respuesta al tratamiento..."
                rows={2}
                style={{ resize: "vertical", minHeight: 56 }}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-error)", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", padding: "0.4rem 0.625rem" }}>
                {error}
              </p>
            )}

            <button
              type="submit" className="btn btn-primary" disabled={saving}
              style={{ background: "#7c3aed", justifyContent: "center" }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Guardando…
                </span>
              ) : (
                <><Plus size={14} /> Guardar seguimiento</>
              )}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
