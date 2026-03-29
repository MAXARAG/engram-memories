"use client";

import { useState, useEffect } from "react";
import { X, Syringe, AlertTriangle, Info } from "lucide-react";
import { AnimalIdentifierField } from "@/components/common/AnimalIdentifierField";
import { findAnimalByIdentifier } from "@/lib/animalReferences";
import type { AnimalRow, SanidadRow, SanidadInsert, TipoSanidad } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_OPTIONS: TipoSanidad[] = [
  "Vacuna",
  "Tratamiento",
  "Desparasitación",
  "Otro",
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SanidadModalProps {
  animals: AnimalRow[];
  initialData?: SanidadRow | null;
  onClose: () => void;
  onSaved: (record: SanidadRow) => void;
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
}

const today = (): string => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

function createInitialState(
  record: SanidadRow | null | undefined,
  animals: AnimalRow[]
): FormState {
  const matchedAnimal = animals.find((animal) => animal.id === record?.animal_id);

  return {
    fecha: record?.fecha ?? today(),
    idAnimal: matchedAnimal?.identificador ?? "",
    especie: record?.especie ?? matchedAnimal?.especie ?? "",
    tratamiento: record?.tratamiento ?? "",
    producto: record?.producto ?? "",
    dosis: record?.dosis ?? "",
    tipo: record?.tipo ?? "",
    diasRetiro: record ? String(record.dias_retiro) : "0",
    responsable: record?.responsable ?? "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SanidadModal({ animals, initialData = null, onClose, onSaved }: SanidadModalProps) {
  const [form, setForm] = useState<FormState>(createInitialState(initialData, animals));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diasRetiroNum = parseInt(form.diasRetiro || "0", 10);
  const hasRetiro = !isNaN(diasRetiroNum) && diasRetiroNum > 0;

  // Calcular fecha fin de retiro para mostrar al usuario
  const fechaFinRetiro = (() => {
    if (!hasRetiro || !form.fecha) return null;
    const base = new Date(form.fecha + "T12:00:00");
    base.setDate(base.getDate() + diasRetiroNum);
    return base.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
  })();

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setForm(createInitialState(initialData, animals));
    setError(null);
  }, [initialData, animals]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name !== "idAnimal") {
        return { ...prev, [name]: value };
      }

      const matchedAnimal = findAnimalByIdentifier(animals, value);
      return {
        ...prev,
        idAnimal: value,
        especie: matchedAnimal?.especie ?? prev.especie,
      };
    });
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.idAnimal.trim()) return setError("Ingresá el ID del animal.");
    if (!form.especie.trim()) return setError("Ingresá la especie.");
    if (!form.tratamiento.trim()) return setError("Ingresá el tratamiento.");
    if (!form.producto.trim()) return setError("Ingresá el producto.");
    if (!form.tipo) return setError("Seleccioná el tipo de tratamiento.");
    if (isNaN(diasRetiroNum) || diasRetiroNum < 0) return setError("Los días de retiro deben ser 0 o más.");

    const matchedAnimal = findAnimalByIdentifier(animals, form.idAnimal);
    if (!matchedAnimal) {
      return setError("El identificador del animal no existe. Seleccioná uno válido.");
    }

    setLoading(true);
    try {
      const { addSanidad, updateSanidad } = await import("@/lib/api");

      const payload: SanidadInsert = {
        fecha: form.fecha,
        animal_id: matchedAnimal.id,
        especie: form.especie.trim() || matchedAnimal.especie,
        tratamiento: form.tratamiento.trim(),
        producto: form.producto.trim() || null,
        dosis: form.dosis.trim() || null,
        tipo: form.tipo as TipoSanidad,
        dias_retiro: diasRetiroNum,
        responsable: form.responsable.trim() || null,
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
      style={{
        background: "rgba(30, 61, 26, 0.6)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).dataset.mdown = e.target === e.currentTarget ? "1" : "0"; }}
      onClick={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.mdown === "1") onClose(); }}
    >
      {/* Panel */}
      <div
        className="w-full max-w-xl animate-fade-in modal-content"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem",
                display: "flex",
              }}
            >
              <Syringe size={20} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initialData ? "Editar Tratamiento Sanitario" : "Nuevo Tratamiento Sanitario"}
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                {initialData
                  ? "Actualizá el tratamiento, producto y período de retiro"
                  : "Registrá el tratamiento, producto y período de retiro"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ color: "rgba(255,255,255,0.7)", padding: "0.375rem" }}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Fecha + ID Animal */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
          >
            <div>
              <label className="label" htmlFor="sm-fecha">
                Fecha
              </label>
              <input
                id="sm-fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="input"
                required
              />
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
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
          >
            <div>
              <label className="label" htmlFor="sm-especie">
                Especie <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="sm-especie"
                type="text"
                name="especie"
                value={form.especie}
                onChange={handleChange}
                className="input"
                placeholder="Bovino, Ovino, Porcino..."
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label" htmlFor="sm-tipo">
                Tipo <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <select
                id="sm-tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="input"
                style={{ cursor: "pointer" }}
                required
              >
                <option value="" disabled>
                  Seleccioná...
                </option>
                {TIPO_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tratamiento */}
          <div>
            <label className="label" htmlFor="sm-tratamiento">
              Tratamiento <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="sm-tratamiento"
              type="text"
              name="tratamiento"
              value={form.tratamiento}
              onChange={handleChange}
              className="input"
              placeholder="Ej: Vacunación FMD, Desparasitación interna..."
              required
            />
          </div>

          {/* Producto + Dosis */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}
          >
            <div>
              <label className="label" htmlFor="sm-producto">
                Producto <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="sm-producto"
                type="text"
                name="producto"
                value={form.producto}
                onChange={handleChange}
                className="input"
                placeholder="Nombre comercial"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="sm-dosis">
                Dosis
              </label>
              <input
                id="sm-dosis"
                type="text"
                name="dosis"
                value={form.dosis}
                onChange={handleChange}
                className="input"
                placeholder="Ej: 5ml/100kg, 1 comp."
              />
            </div>
          </div>

          {/* Días de retiro */}
          <div>
            <label className="label" htmlFor="sm-diasRetiro">
              Días de retiro{" "}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: "var(--color-text-light)",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (0 = sin retiro)
              </span>
            </label>
            <input
              id="sm-diasRetiro"
              type="number"
              name="diasRetiro"
              value={form.diasRetiro}
              onChange={handleChange}
              className="input"
              min="0"
              step="1"
              placeholder="0"
            />
          </div>

          {/* Alerta período de retiro — aparece cuando diasRetiro > 0 */}
          {hasRetiro && (
            <div
              className="animate-fade-in"
              style={{
                background: "#fef3c7",
                border: "1.5px solid #f59e0b",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.625rem",
              }}
            >
              <AlertTriangle
                size={18}
                style={{ color: "#b45309", flexShrink: 0, marginTop: "1px" }}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#92400e",
                    marginBottom: "2px",
                  }}
                >
                  Período de retiro activo: {diasRetiroNum}{" "}
                  {diasRetiroNum === 1 ? "día" : "días"}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#78350f" }}>
                  Este animal{" "}
                  <strong>no podrá ser faenado</strong> hasta el{" "}
                  <strong>{fechaFinRetiro}</strong>. Quedará marcado con{" "}
                  alerta en la pantalla de Sanidad y Faena.
                </p>
              </div>
            </div>
          )}

          {/* Responsable */}
          <div>
            <label className="label" htmlFor="sm-responsable">
              Responsable
            </label>
            <input
              id="sm-responsable"
              type="text"
              name="responsable"
              value={form.responsable}
              onChange={handleChange}
              className="input"
              placeholder="Nombre del veterinario o encargado"
            />
          </div>

          {/* Info campos opcionales */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "-0.25rem",
            }}
          >
            <Info size={13} style={{ color: "var(--color-text-light)", flexShrink: 0 }} />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
              Dosis y Responsable son opcionales; los campos marcados con{" "}
              <span style={{ color: "var(--color-error)" }}>*</span> son obligatorios.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              className="animate-fade-in"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-error)",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.875rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--color-border)",
              marginTop: "0.25rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: "130px" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Guardando…
                </span>
              ) : (
                initialData ? "Guardar cambios" : "Registrar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
