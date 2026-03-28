"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Scissors, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { Faena, Sanidad } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function toApiDate(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function parseDMY(str: string): Date | null {
  const parts = str?.split("/");
  if (parts?.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Verifica si un registro de sanidad tiene retiro activo hoy */
function tieneRetiroActivo(registro: Sanidad): boolean {
  if (!registro.diasRetiro || registro.diasRetiro <= 0) return false;
  const base = parseDMY(registro.fecha);
  if (!base) return false;
  const fin = new Date(base);
  fin.setDate(fin.getDate() + registro.diasRetiro);
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  return fin >= hoy;
}

/** Fecha fin de retiro legible */
function fechaFinRetiroStr(registro: Sanidad): string {
  const base = parseDMY(registro.fecha);
  if (!base) return "";
  const fin = new Date(base);
  fin.setDate(fin.getDate() + registro.diasRetiro);
  return fin.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─── Rendimiento helpers ──────────────────────────────────────────────────────

function calcRendimiento(pesoVivo: number, pesoCanal: number): number | null {
  if (!pesoVivo || !pesoCanal || pesoVivo <= 0) return null;
  return (pesoCanal / pesoVivo) * 100;
}

type RendimientoNivel = "alto" | "medio" | "bajo" | null;

function rendimientoNivel(pct: number | null): RendimientoNivel {
  if (pct === null) return null;
  if (pct > 60) return "alto";
  if (pct >= 50) return "medio";
  return "bajo";
}

const NIVEL_COLORS: Record<NonNullable<RendimientoNivel>, { bg: string; border: string; text: string; label: string }> = {
  alto:  { bg: "#dcfce7", border: "#4ade80", text: "#166534", label: "Excelente" },
  medio: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e", label: "Aceptable" },
  bajo:  { bg: "#fee2e2", border: "#f87171", text: "#991b1b", label: "Bajo" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaenaModalProps {
  onClose: () => void;
  onSaved: (record: Faena) => void;
}

interface FormState {
  fecha: string;
  idAnimal: string;
  especie: string;
  pesoVivo: string;
  pesoCanal: string;
  observaciones: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FaenaModal({ onClose, onSaved }: FaenaModalProps) {
  const [form, setForm] = useState<FormState>({
    fecha: todayISO(),
    idAnimal: "",
    especie: "",
    pesoVivo: "",
    pesoCanal: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retiro sanitario
  const [retiroActivo, setRetiroActivo] = useState<Sanidad | null>(null);
  const [checkingRetiro, setCheckingRetiro] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calcular rendimiento en tiempo real
  const pesoVivoNum = parseFloat(form.pesoVivo);
  const pesoCanalNum = parseFloat(form.pesoCanal);
  const rendimiento = calcRendimiento(pesoVivoNum, pesoCanalNum);
  const nivel = rendimientoNivel(rendimiento);
  const nivelColors = nivel ? NIVEL_COLORS[nivel] : null;

  // Escape handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Debounce: verificar retiro al escribir idAnimal
  const checkRetiro = useCallback(async (idAnimal: string) => {
    if (!idAnimal.trim()) {
      setRetiroActivo(null);
      return;
    }
    setCheckingRetiro(true);
    try {
      const { getAllSanidad } = await import("@/lib/api");
      const result = await getAllSanidad();
      if (result.success && result.data) {
        const registros = result.data.filter(
          (r) =>
            r.idAnimal.trim().toLowerCase() ===
              idAnimal.trim().toLowerCase() && tieneRetiroActivo(r)
        );
        // El más reciente
        const activo = registros.sort((a, b) => {
          const da = parseDMY(a.fecha);
          const db = parseDMY(b.fecha);
          if (!da || !db) return 0;
          return db.getTime() - da.getTime();
        })[0] ?? null;
        setRetiroActivo(activo);
      }
    } catch {
      // silencioso — no queremos interrumpir el flujo del usuario
    } finally {
      setCheckingRetiro(false);
    }
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);

    if (name === "idAnimal") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => checkRetiro(value), 500);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fecha) return setError("Ingresá la fecha.");
    if (!form.idAnimal.trim()) return setError("Ingresá el ID del animal.");
    if (!form.especie.trim()) return setError("Ingresá la especie.");
    if (retiroActivo)
      return setError("No se puede faenar: animal en período de retiro sanitario.");
    if (!form.pesoVivo || isNaN(pesoVivoNum) || pesoVivoNum <= 0)
      return setError("Ingresá un peso vivo válido (mayor a 0).");
    if (!form.pesoCanal || isNaN(pesoCanalNum) || pesoCanalNum <= 0)
      return setError("Ingresá un peso canal válido (mayor a 0).");
    if (pesoCanalNum >= pesoVivoNum)
      return setError("El peso canal no puede ser mayor o igual al peso vivo.");

    setLoading(true);
    try {
      const { addFaena } = await import("@/lib/api");

      const payload: Omit<Faena, "id"> = {
        fecha: toApiDate(form.fecha),
        idAnimal: form.idAnimal.trim(),
        especie: form.especie.trim(),
        pesoVivo: pesoVivoNum,
        pesoCanal: pesoCanalNum,
        rendimiento: 0, // calculated by backend
        observaciones: form.observaciones.trim(),
      };

      const result = await addFaena(payload);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Error al registrar la faena.");
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
        background: "rgba(30, 61, 26, 0.65)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div
        className="w-full max-w-xl animate-fade-in"
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
              <Scissors size={20} color="#fff" />
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
                Registrar Faena
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                Completá los datos del animal y los pesos de faena
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
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label" htmlFor="fm-fecha">
                Fecha <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="fm-fecha"
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="fm-idAnimal">
                ID Animal <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="fm-idAnimal"
                  type="text"
                  name="idAnimal"
                  value={form.idAnimal}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: BOV-0042"
                  required
                  style={
                    retiroActivo
                      ? { borderColor: "#dc2626", boxShadow: "0 0 0 3px rgba(220,38,38,0.12)" }
                      : undefined
                  }
                />
                {checkingRetiro && (
                  <span
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 14,
                      height: 14,
                      border: "2px solid var(--color-primary-muted)",
                      borderTopColor: "var(--color-primary)",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Banner retiro sanitario */}
          {retiroActivo && (
            <div
              className="animate-fade-in"
              style={{
                background: "linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)",
                border: "2px solid #dc2626",
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "#fee2e2",
                  border: "1px solid #f87171",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={18} color="#dc2626" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#991b1b",
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <AlertTriangle size={14} />
                  ANIMAL EN PERÍODO DE RETIRO SANITARIO
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#7f1d1d" }}>
                  <strong>{retiroActivo.producto}</strong> ·{" "}
                  {retiroActivo.tratamiento} · {retiroActivo.diasRetiro} días
                </p>
                <p style={{ fontSize: "0.8125rem", color: "#991b1b", marginTop: "2px" }}>
                  No habilitar faena hasta el{" "}
                  <strong>{fechaFinRetiroStr(retiroActivo)}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Especie */}
          <div>
            <label className="label" htmlFor="fm-especie">
              Especie <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              id="fm-especie"
              type="text"
              name="especie"
              value={form.especie}
              onChange={handleChange}
              className="input"
              placeholder="Bovino, Ovino, Porcino..."
              required
            />
          </div>

          {/* Pesos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label" htmlFor="fm-pesoVivo">
                Peso Vivo (kg){" "}
                <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="fm-pesoVivo"
                type="number"
                name="pesoVivo"
                value={form.pesoVivo}
                onChange={handleChange}
                className="input"
                min="1"
                step="0.1"
                placeholder="Ej: 480"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="fm-pesoCanal">
                Peso Canal (kg){" "}
                <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="fm-pesoCanal"
                type="number"
                name="pesoCanal"
                value={form.pesoCanal}
                onChange={handleChange}
                className="input"
                min="1"
                step="0.1"
                placeholder="Ej: 270"
                required
              />
            </div>
          </div>

          {/* Preview rendimiento */}
          {rendimiento !== null && nivelColors && (
            <div
              className="animate-fade-in"
              style={{
                background: nivelColors.bg,
                border: `1.5px solid ${nivelColors.border}`,
                borderRadius: "var(--radius-md)",
                padding: "0.875rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: nivelColors.text,
                    marginBottom: "2px",
                  }}
                >
                  Rendimiento estimado
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: nivelColors.text,
                    opacity: 0.85,
                  }}
                >
                  (Peso Canal / Peso Vivo) × 100
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: nivelColors.text,
                    lineHeight: 1,
                  }}
                >
                  {rendimiento.toFixed(1)}
                  <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>%</span>
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: nivelColors.text,
                    marginTop: "2px",
                  }}
                >
                  {nivelColors.label}
                </p>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="label" htmlFor="fm-observaciones">
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
              id="fm-observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className="input"
              rows={3}
              placeholder="Anomalías, condiciones del animal, destino de la canal..."
              style={{ resize: "vertical", minHeight: 72 }}
            />
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
            <Info
              size={13}
              style={{ color: "var(--color-text-light)", flexShrink: 0 }}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
              El rendimiento final es calculado por el sistema. Los campos con{" "}
              <span style={{ color: "var(--color-error)" }}>*</span> son
              obligatorios.
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
              disabled={loading || !!retiroActivo}
              style={{ minWidth: "140px" }}
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
                "Registrar Faena"
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
