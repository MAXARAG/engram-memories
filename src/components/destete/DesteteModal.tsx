"use client";

import { useState, useEffect } from "react";
import { X, Baby, Calculator, ArrowRight, ShoppingCart, Beef } from "lucide-react";
import type { Destete, DestinoDestete } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DesteteModalProps {
  onClose: () => void;
  onSaved: (record: Destete) => void;
}

interface FormState {
  fecha: string;
  idCria: string;
  madre: string;
  especie: string;
  nCrias: string;
  peso: string;
  destino: DestinoDestete;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const today = (): string => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

function toApiDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Destino Config ───────────────────────────────────────────────────────────

interface DestinoOption {
  value: DestinoDestete;
  label: string;
  description: string;
  Icon: React.ElementType;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconColor: string;
  badgeClass: string;
}

const DESTINO_OPTIONS: DestinoOption[] = [
  {
    value: "Recría",
    label: "Recría",
    description: "Continúa en el establecimiento",
    Icon: Baby,
    bg: "var(--color-primary-muted)",
    border: "var(--color-border)",
    activeBg: "#dcfce7",
    activeBorder: "#16a34a",
    activeText: "#166534",
    iconColor: "var(--color-primary)",
    badgeClass: "badge-green",
  },
  {
    value: "Venta",
    label: "Venta",
    description: "Sale del establecimiento",
    Icon: ShoppingCart,
    bg: "#eff6ff",
    border: "var(--color-border)",
    activeBg: "#dbeafe",
    activeBorder: "#2563eb",
    activeText: "#1e40af",
    iconColor: "#2563eb",
    badgeClass: "badge-blue",
  },
  {
    value: "Engorde",
    label: "Engorde",
    description: "Pasa a corral de engorde",
    Icon: Beef,
    bg: "#fff7ed",
    border: "var(--color-border)",
    activeBg: "#fed7aa",
    activeBorder: "#ea580c",
    activeText: "#9a3412",
    iconColor: "#ea580c",
    badgeClass: "badge-amber",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function DesteteModal({ onClose, onSaved }: DesteteModalProps) {
  const [form, setForm] = useState<FormState>({
    fecha: today(),
    idCria: "",
    madre: "",
    especie: "",
    nCrias: "",
    peso: "",
    destino: "Recría",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live calculation
  const nCriasNum = parseInt(form.nCrias || "0", 10);
  const pesoNum = parseFloat(form.peso || "0");
  const promedio = nCriasNum > 0 && pesoNum > 0 ? pesoNum / nCriasNum : 0;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function handleDestino(value: DestinoDestete) {
    setForm((prev) => ({ ...prev, destino: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nCrias = parseInt(form.nCrias, 10);
    const peso = parseFloat(form.peso);

    if (!form.idCria.trim()) return setError("Ingresá el ID del lote de crías.");
    if (!form.madre.trim()) return setError("Ingresá el ID de la madre.");
    if (!form.especie.trim()) return setError("Ingresá la especie.");
    if (isNaN(nCrias) || nCrias <= 0) return setError("N° de crías debe ser mayor a 0.");
    if (isNaN(peso) || peso <= 0) return setError("El peso total debe ser mayor a 0.");

    const promedioCalculado = peso / nCrias;

    setLoading(true);
    try {
      const { addDestete } = await import("@/lib/api");

      const payload: Omit<Destete, "id"> = {
        fecha: toApiDate(form.fecha),
        idCria: form.idCria.trim(),
        madre: form.madre.trim(),
        especie: form.especie.trim(),
        nCrias,
        peso,
        promedio: promedioCalculado,
        destino: form.destino,
      };

      const result = await addDestete(payload);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Error al registrar el destete.");
      }

      onSaved(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30, 61, 26, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full animate-fade-in"
        style={{
          maxWidth: 520,
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
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
              <Baby size={20} color="#fff" />
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
                Registrar Destete
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                Registrá el destete y asignale un destino
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

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* fecha */}
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

          {/* idCria + madre */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">ID Lote Crías</label>
              <input
                type="text"
                name="idCria"
                value={form.idCria}
                onChange={handleChange}
                className="input"
                placeholder="EJ-2024-001"
                required
              />
            </div>
            <div>
              <label className="label">ID Madre</label>
              <input
                type="text"
                name="madre"
                value={form.madre}
                onChange={handleChange}
                className="input"
                placeholder="BOV-0042"
                required
              />
            </div>
          </div>

          {/* especie */}
          <div>
            <label className="label">Especie</label>
            <input
              type="text"
              name="especie"
              value={form.especie}
              onChange={handleChange}
              className="input"
              placeholder="Bovino, Ovino, Porcino..."
              required
            />
          </div>

          {/* nCrias + peso */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">N° de Crías</label>
              <input
                type="number"
                name="nCrias"
                value={form.nCrias}
                onChange={handleChange}
                className="input"
                placeholder="0"
                min="1"
                step="1"
                required
              />
            </div>
            <div>
              <label className="label">Peso Total del Lote (kg)</label>
              <input
                type="number"
                name="peso"
                value={form.peso}
                onChange={handleChange}
                className="input"
                placeholder="0.0"
                min="0"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Live preview — promedio */}
          {promedio > 0 && (
            <div
              className="animate-fade-in"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary-muted) 0%, var(--color-accent-muted) 100%)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <Calculator size={15} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Promedio:
              </span>
              <strong
                style={{
                  fontSize: "1rem",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                }}
              >
                {promedio.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg/cría
              </strong>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  color: "var(--color-text-light)",
                  fontStyle: "italic",
                }}
              >
                calculado
              </span>
            </div>
          )}

          {/* destino — radio cards */}
          <div>
            <label className="label" style={{ marginBottom: "0.625rem" }}>
              Destino
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
              {DESTINO_OPTIONS.map((opt) => {
                const isActive = form.destino === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDestino(opt.value)}
                    style={{
                      background: isActive ? opt.activeBg : opt.bg,
                      border: `2px solid ${isActive ? opt.activeBorder : opt.border}`,
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 0.5rem",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.375rem",
                      transition: "all 0.15s ease",
                      boxShadow: isActive ? "0 0 0 3px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <opt.Icon
                      size={20}
                      style={{
                        color: isActive ? opt.activeBorder : opt.iconColor,
                        transition: "color 0.15s",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: isActive ? opt.activeText : "var(--color-text)",
                        transition: "color 0.15s",
                      }}
                    >
                      {opt.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: isActive ? opt.activeText : "var(--color-text-light)",
                        textAlign: "center",
                        lineHeight: 1.3,
                        transition: "color 0.15s",
                      }}
                    >
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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
              style={{ minWidth: 130 }}
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
                <>
                  <ArrowRight size={15} />
                  Registrar Destete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
