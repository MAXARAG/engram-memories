"use client";

import { useState, useEffect } from "react";
import { X, Beef } from "lucide-react";
import type { Animal, AnimalOrigen, AnimalEstado } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ESPECIES = ["Bovino", "Ovino", "Porcino", "Caprino", "Equino", "Aviar"];
const ORIGENES: AnimalOrigen[] = ["Nacido", "Comprado"];
const ESTADOS: AnimalEstado[] = ["Activo", "Vendido", "Muerto", "Faenado"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnimalModalProps {
  onClose: () => void;
  onSaved: (animal: Animal) => void;
}

interface FormState {
  especie: string;
  categoria: string;
  raza: string;
  sexo: string;
  fechaNac: string;
  estado: AnimalEstado;
  sistema: string;
  ubicacion: string;
  origen: AnimalOrigen;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimalModal({ onClose, onSaved }: AnimalModalProps) {
  const [form, setForm] = useState<FormState>({
    especie: "",
    categoria: "",
    raza: "",
    sexo: "",
    fechaNac: "",
    estado: "Activo",
    sistema: "",
    ubicacion: "",
    origen: "Nacido",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function toApiDate(dateStr: string): string {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.especie) return setError("Seleccioná la especie.");
    if (!form.categoria.trim()) return setError("Ingresá la categoría.");
    if (!form.sexo.trim()) return setError("Ingresá el sexo.");
    if (!form.origen) return setError("Seleccioná el origen.");

    setLoading(true);
    try {
      const { addAnimal } = await import("@/lib/api");

      const payload: Omit<Animal, "idAnimal"> = {
        especie: form.especie,
        categoria: form.categoria.trim(),
        raza: form.raza.trim(),
        sexo: form.sexo.trim(),
        fechaNac: form.fechaNac ? toApiDate(form.fechaNac) : "",
        estado: form.estado,
        sistema: form.sistema.trim(),
        ubicacion: form.ubicacion.trim(),
        origen: form.origen,
      };

      const result = await addAnimal(payload);

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Error al registrar el animal.");
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
      <div
        className="w-full max-w-lg animate-fade-in"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          margin: "auto",
        }}
      >
        {/* Header */}
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
              <Beef size={20} color="#fff" />
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
                Nuevo Animal
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                Registrá un nuevo animal en el stock
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
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Especie + Categoría */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label">
                Especie <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <select
                name="especie"
                value={form.especie}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                {ESPECIES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                Categoría <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
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

          {/* Raza + Sexo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label">Raza</label>
              <input
                type="text"
                name="raza"
                value={form.raza}
                onChange={handleChange}
                className="input"
                placeholder="Angus, Hereford..."
              />
            </div>
            <div>
              <label className="label">
                Sexo <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <select
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
          </div>

          {/* Fecha Nac + Origen */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label">Fecha de Nacimiento</label>
              <input
                type="date"
                name="fechaNac"
                value={form.fechaNac}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Origen <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <select
                name="origen"
                value={form.origen}
                onChange={handleChange}
                className="input"
                required
              >
                {ORIGENES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estado + Sistema */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="input"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <input
                type="text"
                name="sistema"
                value={form.sistema}
                onChange={handleChange}
                className="input"
                placeholder="Pastoril, Feedlot..."
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="label">Ubicación</label>
            <input
              type="text"
              name="ubicacion"
              value={form.ubicacion}
              onChange={handleChange}
              className="input"
              placeholder="Potrero 1, Lote A..."
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
                "Registrar Animal"
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
