"use client";

import { useState, useEffect } from "react";
import { AnimalIdentifierField } from "@/components/common/AnimalIdentifierField";
import { findAnimalByIdentifier } from "@/lib/animalReferences";
import {
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  ArrowLeftRight,
} from "lucide-react";
import type { AnimalRow, MovimientoRow, MovimientoInsert, TipoMovimiento } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// (date directly from ISO input)

// ─── Config por tipo ──────────────────────────────────────────────────────────

interface TipoConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  bgSelected: string;
  motivoPlaceholder: string;
  destinoLabel: string;
  destinoPlaceholder: string;
}

const TIPO_CONFIG: Record<TipoMovimiento, TipoConfig> = {
  Alta: {
    label: "Alta",
    icon: ArrowUpCircle,
    color: "#166534",
    bg: "#dcfce7",
    border: "#4ade80",
    bgSelected: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    motivoPlaceholder: "Compra, nacimiento, donación...",
    destinoLabel: "Procedencia",
    destinoPlaceholder: "¿De dónde proviene el animal?",
  },
  Baja: {
    label: "Baja",
    icon: ArrowDownCircle,
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#f87171",
    bgSelected: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    motivoPlaceholder: "Venta, muerte, faena...",
    destinoLabel: "Comprador / Destino",
    destinoPlaceholder: "¿A quién o a dónde va el animal?",
  },
  Traslado: {
    label: "Traslado",
    icon: ArrowRightCircle,
    color: "#1e40af",
    bg: "#dbeafe",
    border: "#60a5fa",
    bgSelected: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    motivoPlaceholder: "Cambio de potrero, rotación...",
    destinoLabel: "Destino",
    destinoPlaceholder: "¿A qué potrero o establecimiento?",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MovimientoModalProps {
  animals: AnimalRow[];
  initialData?: MovimientoRow | null;
  onClose: () => void;
  onSaved: (record: MovimientoRow) => void;
}

interface FormState {
  fecha: string;
  idAnimal: string;
  tipo: TipoMovimiento | "";
  motivo: string;
  destino: string;
  observaciones: string;
}

function createInitialState(
  record: MovimientoRow | null | undefined,
  animals: AnimalRow[]
): FormState {
  const matchedAnimal = animals.find((animal) => animal.id === record?.animal_id);

  return {
    fecha: record?.fecha ?? todayISO(),
    idAnimal: matchedAnimal?.identificador ?? "",
    tipo: record?.tipo ?? "",
    motivo: record?.motivo ?? "",
    destino: record?.destino ?? "",
    observaciones: record?.observaciones ?? "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MovimientoModal({ animals, initialData = null, onClose, onSaved }: MovimientoModalProps) {
  const [form, setForm] = useState<FormState>(createInitialState(initialData, animals));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tipoConfig = form.tipo ? TIPO_CONFIG[form.tipo] : null;

  // Escape handler
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

  // Resetear motivo y destino al cambiar tipo
  function handleTipo(tipo: TipoMovimiento) {
    setForm((prev) => ({ ...prev, tipo, motivo: "", destino: "" }));
    setError(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fecha) return setError("Ingresá la fecha.");
    if (!form.idAnimal.trim()) return setError("Ingresá el ID del animal.");
    if (!form.tipo) return setError("Seleccioná el tipo de movimiento.");
    if (!form.motivo.trim()) return setError("Ingresá el motivo.");

    const matchedAnimal = findAnimalByIdentifier(animals, form.idAnimal);
    if (!matchedAnimal) {
      return setError("El identificador del animal no existe. Seleccioná uno válido.");
    }

    setLoading(true);
    try {
      const { addMovimiento, updateMovimiento } = await import("@/lib/api");

      const payload: MovimientoInsert = {
        fecha: form.fecha,
        animal_id: matchedAnimal.id,
        tipo: form.tipo,
        motivo: form.motivo.trim() || null,
        destino: form.destino.trim() || null,
        observaciones: form.observaciones.trim() || null,
      };

      const saved = initialData
        ? await updateMovimiento(initialData.id, payload)
        : await addMovimiento(payload);
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
        background: "rgba(30, 61, 26, 0.65)",
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
              <ArrowLeftRight size={20} color="#fff" />
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
                {initialData ? "Editar Movimiento" : "Registrar Movimiento"}
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                {initialData ? "Actualizá el alta, baja o traslado del animal" : "Alta, baja o traslado de un animal"}
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
            gap: "1.125rem",
          }}
        >
          {/* Fecha + ID Animal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label" htmlFor="mv-fecha">
                Fecha <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="mv-fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <AnimalIdentifierField
              id="mv-idAnimal"
              name="idAnimal"
              label="ID Animal"
              value={form.idAnimal}
              animals={animals}
              onChange={handleChange}
              placeholder="Ej: BOV-0042"
              required
            />
          </div>

          {/* Tipo — Radio Cards */}
          <div>
            <label className="label" style={{ marginBottom: "0.625rem" }}>
              Tipo de movimiento{" "}
              <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.625rem",
              }}
            >
              {(["Alta", "Baja", "Traslado"] as TipoMovimiento[]).map((tipo) => {
                const cfg = TIPO_CONFIG[tipo];
                const Icon = cfg.icon;
                const selected = form.tipo === tipo;

                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleTipo(tipo)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.875rem 0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: `2px solid ${selected ? cfg.border : "var(--color-border)"}`,
                      background: selected ? cfg.bgSelected : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      outline: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: selected ? cfg.bg : "var(--color-primary-muted)",
                        border: `1.5px solid ${selected ? cfg.border : "var(--color-border)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon
                        size={20}
                        color={selected ? cfg.color : "var(--color-text-muted)"}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: selected ? 700 : 500,
                        color: selected ? cfg.color : "var(--color-text-muted)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivo — aparece cuando hay tipo */}
          {form.tipo && (
            <div className="animate-fade-in">
              <label className="label" htmlFor="mv-motivo">
                Motivo <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="mv-motivo"
                type="text"
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                className="input"
                placeholder={tipoConfig?.motivoPlaceholder}
                required
              />
            </div>
          )}

          {/* Destino / Procedencia — aparece cuando hay tipo */}
          {form.tipo && (
            <div className="animate-fade-in">
              <label className="label" htmlFor="mv-destino">
                {tipoConfig?.destinoLabel}{" "}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 400,
                    color: "var(--color-text-light)",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (opcional)
                </span>
              </label>
              <input
                id="mv-destino"
                type="text"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                className="input"
                placeholder={tipoConfig?.destinoPlaceholder}
              />
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="label" htmlFor="mv-observaciones">
              Observaciones{" "}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 400,
                  color: "var(--color-text-light)",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (opcional)
              </span>
            </label>
            <textarea
              id="mv-observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Condición del animal, contexto del movimiento..."
              style={{ resize: "vertical", minHeight: 72 }}
            />
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
              style={{ minWidth: "160px" }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
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
                initialData ? "Guardar cambios" : "Registrar Movimiento"
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
