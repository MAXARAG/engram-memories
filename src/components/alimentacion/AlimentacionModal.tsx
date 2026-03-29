"use client";

import { useState, useEffect } from "react";
import { X, Wheat, Calculator } from "lucide-react";
import type { AlimentacionRow, AlimentacionInsert } from "@/types/database";

interface AlimentacionModalProps {
  initialData?: AlimentacionRow | null;
  onClose: () => void;
  onSaved: (record: AlimentacionRow) => void;
}

interface FormState {
  fecha: string;
  especie: string;
  categoria: string;
  racion: string;
  kgAnimal: string;
  cantidad: string;
  costoKg: string;
}

const today = (): string => {
  const d = new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD for date input
};

function createInitialState(record?: AlimentacionRow | null): FormState {
  return {
    fecha: record?.fecha ?? today(),
    especie: record?.especie ?? "",
    categoria: record?.categoria ?? "",
    racion: record?.racion ?? "",
    kgAnimal: record ? String(record.kg_animal) : "",
    cantidad: record ? String(record.cantidad) : "",
    costoKg: record ? String(record.costo_kg) : "",
  };
}

export function AlimentacionModal({ initialData = null, onClose, onSaved }: AlimentacionModalProps) {
  const [form, setForm] = useState<FormState>({
    ...createInitialState(initialData),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview calculations (frontend only, backend recalculates on save)
  const previewTotalKg =
    parseFloat(form.kgAnimal || "0") * parseInt(form.cantidad || "0", 10);
  const previewCostoTotal = previewTotalKg * parseFloat(form.costoKg || "0");

  const hasPreview = previewTotalKg > 0 || previewCostoTotal > 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setForm(createInitialState(initialData));
    setError(null);
  }, [initialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const kgAnimal = parseFloat(form.kgAnimal);
    const cantidad = parseInt(form.cantidad, 10);
    const costoKg = parseFloat(form.costoKg);

    if (!form.especie.trim()) return setError("Ingresá la especie.");
    if (!form.categoria.trim()) return setError("Ingresá la categoría.");
    if (!form.racion.trim()) return setError("Ingresá la ración.");
    if (isNaN(kgAnimal) || kgAnimal <= 0)
      return setError("Kg/Animal debe ser mayor a 0.");
    if (isNaN(cantidad) || cantidad <= 0)
      return setError("La cantidad de animales debe ser mayor a 0.");
    if (isNaN(costoKg) || costoKg < 0)
      return setError("El costo/kg debe ser un número válido.");

    setLoading(true);
    try {
      const { addAlimentacion, updateAlimentacion } = await import("@/lib/api");

      const payload: AlimentacionInsert = {
        fecha: form.fecha,
        especie: form.especie.trim(),
        categoria: form.categoria.trim(),
        racion: form.racion.trim(),
        kg_animal: kgAnimal,
        cantidad,
        costo_kg: costoKg,
        total_kg: kgAnimal * cantidad,
        costo_total: kgAnimal * cantidad * costoKg,
      };

      const saved = initialData
        ? await updateAlimentacion(initialData.id, payload)
        : await addAlimentacion(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: "rgba(30, 61, 26, 0.55)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).dataset.mdown = e.target === e.currentTarget ? "1" : "0"; }}
      onClick={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLDivElement).dataset.mdown === "1") onClose(); }}
    >
      {/* Panel */}
      <div
        className="w-full max-w-lg animate-fade-in modal-content"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
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
              <Wheat size={20} color="#fff" />
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
                {initialData ? "Editar Alimentación" : "Nueva Carga de Alimentación"}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", marginTop: "1px" }}>
                {initialData ? "Actualizá el consumo diario de ración" : "Registrá el consumo diario de ración"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ color: "rgba(255,255,255,0.7)", padding: "0.375rem" }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Row 1: fecha */}
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Row 2: especie + categoria */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Especie</label>
              <input
                type="text"
                name="especie"
                value={form.especie}
                onChange={handleChange}
                className="input"
                placeholder="Bovino, Ovino..."
                required
              />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input
                type="text"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="input"
                placeholder="Ternero, Vaca..."
                required
              />
            </div>
          </div>

          {/* Row 3: racion */}
          <div>
            <label className="label">Ración</label>
            <input
              type="text"
              name="racion"
              value={form.racion}
              onChange={handleChange}
              className="input"
              placeholder="Maíz entero, Balanceado iniciador..."
              required
            />
          </div>

          {/* Row 4: kgAnimal + cantidad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Kg / Animal</label>
              <input
                type="number"
                name="kgAnimal"
                value={form.kgAnimal}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="label">Cantidad (animales)</label>
              <input
                type="number"
                name="cantidad"
                value={form.cantidad}
                onChange={handleChange}
                className="input"
                placeholder="0"
                min="1"
                step="1"
                required
              />
            </div>
          </div>

          {/* Row 5: costoKg */}
          <div>
            <label className="label">Costo / Kg ($)</label>
            <input
              type="number"
              name="costoKg"
              value={form.costoKg}
              onChange={handleChange}
              className="input"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Live Preview */}
          {hasPreview && (
            <div
              className="animate-fade-in"
              style={{
                background: "linear-gradient(135deg, var(--color-primary-muted) 0%, var(--color-accent-muted) 100%)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <Calculator size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Total KG:{" "}
                  <strong style={{ color: "var(--color-primary-dark)", fontWeight: 700 }}>
                    {previewTotalKg.toLocaleString("es-AR", { maximumFractionDigits: 1 })} kg
                  </strong>
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Costo Total:{" "}
                  <strong style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                    ${previewCostoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  color: "var(--color-text-light)",
                  fontStyle: "italic",
                }}
              >
                estimado
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p
              className="animate-fade-in"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-error)",
                background: "#fee2e2",
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
              style={{ minWidth: "120px" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.4)",
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
