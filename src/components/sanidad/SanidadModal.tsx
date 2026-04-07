"use client";

import { useState, useEffect } from "react";
import { X, Syringe, AlertTriangle, Info, Activity, RefreshCw } from "lucide-react";
import { AnimalIdentifierField } from "@/components/common/AnimalIdentifierField";
import { findAnimalByIdentifier } from "@/lib/animalReferences";
import { SeguimientoExpandable } from "@/components/sanidad/SeguimientoExpandable";
import type { AnimalRow, SanidadRow, SanidadInsert, TipoSanidad } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_OPTIONS: TipoSanidad[] = ["Vacuna", "Tratamiento", "Desparasitación", "Otro"];



// ─── Types ────────────────────────────────────────────────────────────────────

interface SanidadModalProps {
  animals: AnimalRow[];
  initialData?: LinaresRow | null;
  onClose: () => void;
  onSaved: (record: LinaresRow) => void;
}

interface FormState {
  fecha: string;
  idAnimal: string;
  especie: string;
  tratamiento: string;
  producto: string;
  dosis: string;
  tipo: string;
  diasRetiro: string;
  responsable: string;
  // Repetición
  proximaFecha: string;
  frecuenciaDias: string;
}

const today = (): string => new Date().toISOString().split("T")[0];

function createInitialState(record: SanidadRow | null | undefined, animals: AnimalRow[]): FormState {
  const matchedAnimal = animals.find((a) => a.id === record?.animal_id);
  return {
    fecha:          record?.fecha ?? today(),
    idAnimal:       matchedAnimal?.identificador ?? "",
    especie:        record?.especie ?? matchedAnimal?.especie ?? "",
    tratamiento:    record?.tratamiento ?? "",
    producto:       record?.producto ?? "",
    dosis:          record?.dosis ?? "",
    tipo:           record?.tipo ?? "",
    diasRetiro:     record ? String(record.dias_retiro) : "0",
    responsable:    record?.responsable ?? "",
    // Repetición
    proximaFecha:   record?.proxima_fecha ?? "",
    frecuenciaDias: record?.frecuencia_dias != null ? String(record.frecuencia_dias) : "",
  };
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--color-border)",
        marginBottom: "0.25rem",
      }}
    >
      {icon}
      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SanidadModal({ animals, initialData = null, onClose, onSaved }: SanidadModalProps) {
  const [form, setForm] = useState<FormState>(createInitialState(initialData, animals));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diasRetiroNum = parseInt(form.diasRetiro || "0", 10);
  const hasRetiro = !isNaN(diasRetiroNum) && diasRetiroNum > 0;

  const fechaFinRetiro = (() => {
    if (!hasRetiro || !form.fecha) return null;
    const base = new Date(form.fecha + "T12:00:00");
    base.setDate(base.getDate() + diasRetiroNum);
    return base.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  })();

  // Auto-calcular próxima fecha si hay frecuencia en días
  function calcularProximaFecha(fechaBase: string, frecuencia: string): string {
    const freq = parseInt(frecuencia, 10);
    if (!freq || freq <= 0 || !fechaBase) return "";
    const base = new Date(fechaBase + "T12:00:00");
    base.setDate(base.getDate() + freq);
    return base.toISOString().split("T")[0];
  }

  useEffect(() => {
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") onClose(); });
  }, [onClose]);

  useEffect(() => {
    setForm(createInitialState(initialData, animals));
    setError(null);
  }, [initialData, animals]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;

    setForm((prev) => {
      let next = { ...prev, [name]: value };

      // Auto-fill especie cuando cambia el animal
      if (name === "idAnimal") {
        const matched = findAnimalByIdentifier(animals, value);
        next.especie = matched?.especie ?? prev.especie;
      }

      // Auto-calcular próxima fecha cuando cambia la frecuencia o la fecha
      if (name === "frecuenciaDias" || name === "fecha") {
        const freq = name === "frecuenciaDias" ? value : prev.frecuenciaDias;
        const fecha = name === "fecha" ? value : prev.fecha;
        if (freq && parseInt(freq, 10) > 0) {
          next.proximaFecha = calcularProximaFecha(fecha, freq);
        }
      }

      return next;
    });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.idAnimal.trim()) return setError("Ingresá el ID del animal.");
    if (!form.especie.trim()) return setError("Ingresá la especie.");
    if (!form.tratamiento.trim()) return setError("Ingresá el tratamiento.");
    if (!form.producto.trim()) return setError("Ingresá el producto.");
    if (!form.tipo) return setError("Seleccioná el tipo de tratamiento.");
    if (isNaN(diasRetiroNum) || diasRetiroNum < 0) return setError("Los días de retiro deben ser 0 o más.");

    const matchedAnimal = findAnimalByIdentifier(animals, form.idAnimal);
    if (!matchedAnimal) return setError("El identificador del animal no existe. Seleccioná uno válido.");

    const freqNum = form.frecuenciaDias ? parseInt(form.frecuenciaDias, 10) : null;

    setLoading(true);
    try {
      const { addSanidad, updateSanidad } = await import("@/lib/api");

      const payload: SanidadInsert = {
        fecha:           form.fecha,
        animal_id:       matchedAnimal.id,
        especie:         form.especie.trim() || matchedAnimal.especie,
        tratamiento:     form.tratamiento.trim(),
        producto:        form.producto.trim() || null,
        dosis:           form.dosis.trim() || null,
        tipo:            form.tipo as TipoSanidad,
        dias_retiro:     diasRetiroNum,
        responsable:     form.responsable.trim() || null,
        // Repetición
        proxima_fecha:   form.proximaFecha || null,
        frecuencia_dias: freqNum && freqNum > 0 ? freqNum : null,
      };

      const saved = initialData
        ? await updateSanidad(initialData.id, payload)
        : await addSanidad(payload);

      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: "rgba(30, 61, 26, 0.6)", backdropFilter: "blur(4px)", overflowY: "auto" }}
      onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).dataset.mdown = e.target === e.currentTarget ? "1" : "0"; }}
      onClick={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.mdown === "1") onClose(); }}
    >
      <div
        className="w-full animate-fade-in modal-content"
        style={{
          maxWidth: initialData?.id ? "900px" : "576px",
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          margin: "auto",
          transition: "max-width 0.2s ease",
        }}
      >
        {/* ── Header ── */}
        <div style={{ background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius-md)", padding: "0.5rem", display: "flex" }}>
              <Syringe size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "#fff" }}>
                {initialData ? "Editar Tratamiento" : "Nuevo Tratamiento Sanitario"}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: "1px" }}>
                {initialData ? "Actualizá el tratamiento y seguimiento" : "Registrá tratamiento, seguimiento y repetición"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ color: "rgba(255,255,255,0.7)", padding: "0.375rem" }} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* ── Body: form + panel seguimiento ── */}
        <div style={{ display: "flex", maxHeight: "80vh" }}>

        {/* ── Form (columna izquierda) ── */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: 0, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>

          {/* ── DATOS DEL TRATAMIENTO ── */}
          <SectionHeader icon={<Syringe size={14} style={{ color: "var(--color-primary)" }} />} label="Datos del Tratamiento" />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Fecha + Animal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Fecha</label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="input" required />
              </div>
              <AnimalIdentifierField
                id="sm-idAnimal"
                name="idAnimal"
                label="ID Animal"
                value={form.idAnimal}
                animals={animals}
                onChange={handleChange}
                placeholder="Ej: BOV-0042"
                required
              />
            </div>

            {/* Especie + Tipo */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Especie <span style={{ color: "var(--color-error)" }}>*</span></label>
                <input type="text" name="especie" value={form.especie} onChange={handleChange} className="input" placeholder="Bovino, Porcino..." required autoComplete="off" />
              </div>
              <div>
                <label className="label">Tipo <span style={{ color: "var(--color-error)" }}>*</span></label>
                <select name="tipo" value={form.tipo} onChange={handleChange} className="input" required>
                  <option value="" disabled>Seleccioná...</option>
                  {TIPO_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Tratamiento */}
            <div>
              <label className="label">Tratamiento <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input type="text" name="tratamiento" value={form.tratamiento} onChange={handleChange} className="input" placeholder="Ej: Vacunación FMD, Desparasitación interna..." required />
            </div>

            {/* Producto + Dosis */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Producto <span style={{ color: "var(--color-error)" }}>*</span></label>
                <input type="text" name="producto" value={form.producto} onChange={handleChange} className="input" placeholder="Nombre comercial" required />
              </div>
              <div>
                <label className="label">Dosis</label>
                <input type="text" name="dosis" value={form.dosis} onChange={handleChange} className="input" placeholder="5ml/100kg, 1 comp." />
              </div>
            </div>

            {/* Días de retiro */}
            <div>
              <label className="label">
                Días de retiro{" "}
                <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-light)", textTransform: "none" }}>(0 = sin retiro)</span>
              </label>
              <input type="number" name="diasRetiro" value={form.diasRetiro} onChange={handleChange} className="input" min="0" step="1" placeholder="0" />
            </div>

            {/* Alerta retiro */}
            {hasRetiro && (
              <div className="animate-fade-in" style={{ background: "#fef3c7", border: "1.5px solid #f59e0b", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <AlertTriangle size={18} style={{ color: "#b45309", flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#92400e", marginBottom: "2px" }}>
                    Período de retiro: {diasRetiroNum} {diasRetiroNum === 1 ? "día" : "días"}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#78350f" }}>
                    Animal <strong>no podrá ser faenado</strong> hasta el <strong>{fechaFinRetiro}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Responsable */}
            <div>
              <label className="label">Responsable</label>
              <input type="text" name="responsable" value={form.responsable} onChange={handleChange} className="input" placeholder="Veterinario o encargado" />
            </div>
          </div>

          {/* ── REPETICIÓN / PRÓXIMA DOSIS ── */}
          <SectionHeader icon={<RefreshCw size={14} style={{ color: "#0369a1" }} />} label="Repetición / Próxima Dosis" />

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Frecuencia (cada X días)</label>
                <input
                  type="number"
                  name="frecuenciaDias"
                  value={form.frecuenciaDias}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: 30"
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="label">Próxima fecha</label>
                <input
                  type="date"
                  name="proximaFecha"
                  value={form.proximaFecha}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
            {form.proximaFecha && (
              <div className="animate-fade-in" style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "var(--radius-md)", padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "#1e40af" }}>
                🔔 El sistema avisará cuando se acerque el <strong>{new Date(form.proximaFecha + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</strong>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Info size={13} style={{ color: "var(--color-text-light)", flexShrink: 0 }} />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
              Los campos de Seguimiento y Repetición son opcionales.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="animate-fade-in" style={{ fontSize: "0.875rem", color: "var(--color-error)", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", padding: "0.625rem 0.875rem" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: "130px" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Guardando…
                </span>
              ) : initialData ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </form>

        {/* ── Panel derecho: Seguimiento (solo al editar) ── */}
        {initialData?.id && (
          <div
            style={{
              width: "340px",
              flexShrink: 0,
              borderLeft: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              overflowY: "auto",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
            }}
          >
            {/* Título del panel */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.625rem", borderBottom: "1px solid var(--color-border)" }}>
              <Activity size={15} style={{ color: "#7c3aed" }} />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Seguimientos
              </span>
            </div>
            <SeguimientoExpandable
              sanidad={initialData}
            />
          </div>
        )}

        </div>{/* fin body flex */}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

