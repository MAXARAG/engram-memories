"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Building2, TrendingUp, Info, AlertCircle } from "lucide-react";
import type { CostoRow, CostoInsert, TipoCosto } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIA_OPTIONS = [
  "Alimentación",
  "Sanidad",
  "Mano de obra",
  "Infraestructura",
  "Combustible",
  "Veterinario",
  "Otros",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// (date directly from ISO input)

function formatMonto(value: string): string {
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "";
  return num.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CostoModalProps {
  initialData?: CostoRow | null;
  onClose: () => void;
  onSaved: (record: CostoRow) => void;
}

interface FormState {
  fecha: string;
  categoria: string;
  concepto: string;
  especie: string;
  monto: string;
  tipo: TipoCosto;
}

// ─── Tipo Card ────────────────────────────────────────────────────────────────

interface TipoCardProps {
  value: TipoCosto;
  selected: boolean;
  onSelect: () => void;
}

function TipoCard({ value, selected, onSelect }: TipoCardProps) {
  const isFijo = value === "Fijo";
  const Icon = isFijo ? Building2 : TrendingUp;
  const color = isFijo ? "#1e40af" : "#c2410c";
  const bg = isFijo ? "#dbeafe" : "#ffedd5";
  const borderColor = isFijo ? "#3b82f6" : "#f97316";
  const desc = isFijo ? "Se repite periódicamente" : "Depende de la producción";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        flex: 1,
        padding: "0.875rem 1rem",
        borderRadius: "var(--radius-md)",
        border: selected ? `2px solid ${borderColor}` : "2px solid var(--color-border)",
        background: selected ? bg : "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        transition: "all 0.15s ease",
        textAlign: "left",
        boxShadow: selected ? `0 0 0 3px ${isFijo ? "rgba(59,130,246,0.15)" : "rgba(249,115,22,0.15)"}` : "none",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-md)",
          background: selected ? color : "var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.15s ease",
        }}
      >
        <Icon size={18} color={selected ? "#fff" : "var(--color-text-muted)"} />
      </div>
      <div>
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.9rem",
            color: selected ? color : "var(--color-text)",
            marginBottom: "1px",
          }}
        >
          {value}
        </p>
        <p
          style={{
            fontSize: "0.75rem",
            color: selected ? color : "var(--color-text-muted)",
            opacity: selected ? 0.85 : 1,
          }}
        >
          {desc}
        </p>
      </div>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function createInitialState(record?: CostoRow | null): FormState {
  return {
    fecha: record?.fecha ?? todayISO(),
    categoria: record?.categoria ?? "",
    concepto: record?.concepto ?? "",
    especie: record?.especie ?? "",
    monto: record ? String(record.monto) : "",
    tipo: record?.tipo ?? "Fijo",
  };
}

export function CostoModal({ initialData = null, onClose, onSaved }: CostoModalProps) {
  const [form, setForm] = useState<FormState>({
    ...createInitialState(initialData),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = parseFloat(form.monto.replace(/[^0-9.]/g, "")) || 0;
  const montoPreview = montoNum > 0 ? formatMonto(form.monto) : null;

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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.categoria.trim()) return setError("Seleccioná o ingresá una categoría.");
    if (!form.concepto.trim()) return setError("Ingresá el concepto del costo.");
    if (!form.monto || montoNum <= 0) return setError("Ingresá un monto válido mayor a cero.");

    setLoading(true);
    try {
      const { addCosto, updateCosto } = await import("@/lib/api");

      const payload: CostoInsert = {
        fecha: form.fecha,
        categoria: form.categoria.trim(),
        concepto: form.concepto.trim(),
        especie: form.especie.trim() || null,
        monto: montoNum,
        tipo: form.tipo,
      };

      const saved = initialData
        ? await updateCosto(initialData.id, payload)
        : await addCosto(payload);
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
              "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem",
                display: "flex",
              }}
            >
              <DollarSign size={20} color="#fff" />
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
                {initialData ? "Editar Costo" : "Registrar Costo"}
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.75)",
                  marginTop: "1px",
                }}
              >
                {initialData ? "Actualizá el costo registrado" : "Fijo o variable, por categoría y especie"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ color: "rgba(255,255,255,0.8)", padding: "0.375rem" }}
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
          {/* Fecha */}
          <div>
            <label className="label" htmlFor="cm-fecha">
              Fecha
            </label>
            <input
              id="cm-fecha"
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="label" htmlFor="cm-categoria">
              Categoría <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="cm-categoria"
              type="text"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="input"
              placeholder="Ej: Alimentación, Sanidad, Combustible..."
              list="categorias-list"
              autoComplete="off"
              required
            />
            <datalist id="categorias-list">
              {CATEGORIA_OPTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Concepto */}
          <div>
            <label className="label" htmlFor="cm-concepto">
              Concepto <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="cm-concepto"
              type="text"
              name="concepto"
              value={form.concepto}
              onChange={handleChange}
              className="input"
              placeholder="Descripción del gasto (Ej: Fardo de heno, Vacuna aftosa...)"
              required
            />
          </div>

          {/* Especie + Monto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label" htmlFor="cm-especie">
                Especie
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 400,
                    color: "var(--color-text-light)",
                    textTransform: "none",
                    letterSpacing: 0,
                    marginLeft: "0.25rem",
                  }}
                >
                  (opcional)
                </span>
              </label>
              <input
                id="cm-especie"
                type="text"
                name="especie"
                value={form.especie}
                onChange={handleChange}
                className="input"
                placeholder="General"
              />
            </div>
            <div>
              <label className="label" htmlFor="cm-monto">
                Monto ($) <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="cm-monto"
                type="number"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                className="input"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Preview monto */}
          {montoPreview && (
            <div
              className="animate-fade-in"
              style={{
                background: "var(--color-accent-muted)",
                border: "1px solid rgba(139,105,20,0.25)",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "-0.5rem",
              }}
            >
              <DollarSign size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
              <p style={{ fontSize: "0.875rem", color: "var(--color-accent)", fontWeight: 600 }}>
                $ {montoPreview}
              </p>
            </div>
          )}

          {/* Tipo — Radio Cards */}
          <div>
            <label className="label" style={{ marginBottom: "0.5rem" }}>
              Tipo de costo <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <TipoCard
                value="Fijo"
                selected={form.tipo === "Fijo"}
                onSelect={() => {
                  setForm((p) => ({ ...p, tipo: "Fijo" }));
                  setError(null);
                }}
              />
              <TipoCard
                value="Variable"
                selected={form.tipo === "Variable"}
                onSelect={() => {
                  setForm((p) => ({ ...p, tipo: "Variable" }));
                  setError(null);
                }}
              />
            </div>
          </div>

          {/* Info */}
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
              Especie es opcional — si el costo aplica a toda la explotación, dejalo en blanco (se usará{" "}
              <em>General</em>).
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.875rem",
                color: "var(--color-error)",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                padding: "0.625rem 0.875rem",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
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
              style={{
                minWidth: "130px",
                background: loading ? undefined : "var(--color-accent)",
              }}
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
                initialData ? "Guardar cambios" : "Registrar costo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
