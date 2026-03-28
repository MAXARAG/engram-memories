"use client";

import { useState, useEffect } from "react";
import { X, Heart, FlaskConical, Calendar, Baby, ChevronDown } from "lucide-react";
import type { Reproduccion, TipoServicio } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIES = ["Bovino", "Ovino", "Porcino", "Caprino", "Otro"] as const;

const DIAGNOSTICOS = [
  "Positivo",
  "Negativo",
  "Pendiente",
  "No realizado",
] as const;

const GESTACION_DIAS: Record<string, number> = {
  Bovino: 280,
  Ovino:  150,
  Porcino: 114,
  Caprino: 150,
  Otro:   280,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function toApiDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(isoDate: string, days: number): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  idMadre: string;
  especie: string;
  fechaServicio: string;
  macho: string;
  tipoServicio: TipoServicio | "";
  diagnostico: string;
  fechaParto: string;
  nCrias: string;
}

interface ReproduccionModalProps {
  onClose: () => void;
  onSaved: (record: Reproduccion) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ReproduccionModal({ onClose, onSaved }: ReproduccionModalProps) {
  const [form, setForm] = useState<FormState>({
    idMadre: "",
    especie: "",
    fechaServicio: today(),
    macho: "",
    tipoServicio: "",
    diagnostico: "Pendiente",
    fechaParto: "",
    nCrias: "0",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Calculated estimated birth date
  const estimatedParto =
    form.especie && form.fechaServicio
      ? addDays(form.fechaServicio, GESTACION_DIAS[form.especie] ?? 280)
      : null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function setTipoServicio(tipo: TipoServicio) {
    setForm((prev) => ({ ...prev, tipoServicio: tipo }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.idMadre.trim()) return setError("Ingresá el ID de la madre.");
    if (!form.especie) return setError("Seleccioná la especie.");
    if (!form.fechaServicio) return setError("Ingresá la fecha de servicio.");
    if (!form.macho.trim()) return setError("Ingresá el ID o nombre del macho.");
    if (!form.tipoServicio) return setError("Seleccioná el tipo de servicio.");

    setLoading(true);
    try {
      const { addReproduccion } = await import("@/lib/api");

      const payload: Omit<Reproduccion, "id"> = {
        idMadre: form.idMadre.trim(),
        especie: form.especie,
        fechaServicio: toApiDate(form.fechaServicio),
        macho: form.macho.trim(),
        tipoServicio: form.tipoServicio as TipoServicio,
        diagnostico: form.diagnostico,
        fechaParto: toApiDate(form.fechaParto),
        nCrias: parseInt(form.nCrias, 10) || 0,
      };

      const result = await addReproduccion(payload);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Error al registrar el servicio.");
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
      style={{
        background: "rgba(30, 61, 26, 0.55)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full animate-fade-in"
        style={{
          maxWidth: 560,
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
              <Heart size={20} color="#fff" />
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
                Registrar Servicio
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                Control reproductivo del rodeo
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
          {/* Row 1: idMadre + especie */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">ID Madre</label>
              <input
                type="text"
                name="idMadre"
                value={form.idMadre}
                onChange={handleChange}
                className="input"
                placeholder="Ej: VV-0042"
                required
              />
            </div>
            <div>
              <label className="label">Especie</label>
              <div style={{ position: "relative" }}>
                <select
                  name="especie"
                  value={form.especie}
                  onChange={handleChange}
                  className="input"
                  style={{ cursor: "pointer", appearance: "none", paddingRight: "2.25rem" }}
                  required
                >
                  <option value="">Seleccioná...</option>
                  {ESPECIES.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--color-text-muted)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 2: fechaServicio + macho */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Fecha de Servicio</label>
              <input
                type="date"
                name="fechaServicio"
                value={form.fechaServicio}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Macho</label>
              <input
                type="text"
                name="macho"
                value={form.macho}
                onChange={handleChange}
                className="input"
                placeholder="ID o nombre"
                required
              />
            </div>
          </div>

          {/* Tipo de servicio — radio cards */}
          <div>
            <label className="label">Tipo de Servicio</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginTop: "0.25rem" }}>
              {(["Natural", "Inseminación"] as TipoServicio[]).map((tipo) => {
                const isSelected = form.tipoServicio === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoServicio(tipo)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: isSelected
                        ? "2px solid var(--color-primary)"
                        : "1.5px solid var(--color-border)",
                      background: isSelected ? "var(--color-primary-muted)" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9375rem",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? "var(--color-primary-dark)" : "var(--color-text-muted)",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-md)",
                        background: isSelected
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s ease",
                      }}
                    >
                      {tipo === "Natural" ? (
                        <Heart
                          size={16}
                          color={isSelected ? "#fff" : "var(--color-text-light)"}
                        />
                      ) : (
                        <FlaskConical
                          size={16}
                          color={isSelected ? "#fff" : "var(--color-text-light)"}
                        />
                      )}
                    </span>
                    {tipo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnóstico */}
          <div>
            <label className="label">Diagnóstico</label>
            <div style={{ position: "relative" }}>
              <select
                name="diagnostico"
                value={form.diagnostico}
                onChange={handleChange}
                className="input"
                style={{ cursor: "pointer", appearance: "none", paddingRight: "2.25rem" }}
              >
                {DIAGNOSTICOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown
                size={15}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "var(--color-text-muted)",
                }}
              />
            </div>
          </div>

          {/* Parto real (opcional) */}
          <div
            style={{
              background: "var(--color-primary-muted)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Datos del Parto (completar cuando ocurra)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Fecha de Parto</label>
                <input
                  type="date"
                  name="fechaParto"
                  value={form.fechaParto}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="label">N° de Crías</label>
                <input
                  type="number"
                  name="nCrias"
                  value={form.nCrias}
                  onChange={handleChange}
                  className="input"
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Preview: parto estimado */}
          {estimatedParto && (
            <div
              className="animate-fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                background: "linear-gradient(135deg, var(--color-accent-muted) 0%, #fffbf0 100%)",
                border: "1px solid #e9d597",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
              }}
            >
              <Baby size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Parto estimado:{" "}
                <strong
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-accent)",
                    fontWeight: 700,
                  }}
                >
                  {estimatedParto}
                </strong>
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  color: "var(--color-text-light)",
                  fontStyle: "italic",
                }}
              >
                {GESTACION_DIAS[form.especie] ?? 280} días de gestación
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
                "Registrar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
