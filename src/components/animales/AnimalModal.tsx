"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type {
  AnimalEstado,
  AnimalInsert,
  AnimalOrigen,
  AnimalRow,
} from "@/types/database";
import { CowIcon } from "@/components/icons/CowIcon";

const ESPECIES = ["Bovino", "Ovino", "Porcino", "Caprino", "Equino", "Aviar"];
const ORIGENES: AnimalOrigen[] = ["Nacido", "Comprado"];
const ESTADOS: AnimalEstado[] = ["Activo", "Vendido", "Muerto", "Faenado"];

interface AnimalModalProps {
  initialData?: AnimalRow | null;
  onClose: () => void;
  onSaved: (animal: AnimalRow) => void;
}

interface FormState {
  identificador: string;
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

function createInitialState(animal?: AnimalRow | null): FormState {
  return {
    identificador: animal?.identificador ?? "",
    especie: animal?.especie ?? "",
    categoria: animal?.categoria ?? "",
    raza: animal?.raza ?? "",
    sexo: animal?.sexo ?? "",
    fechaNac: animal?.fecha_nac ?? "",
    estado: animal?.estado ?? "Activo",
    sistema: animal?.sistema ?? "",
    ubicacion: animal?.ubicacion ?? "",
    origen: animal?.origen ?? "Nacido",
  };
}

export function AnimalModal({ initialData = null, onClose, onSaved }: AnimalModalProps) {
  const [form, setForm] = useState<FormState>(() => createInitialState(initialData));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.identificador.trim()) return setError("Ingresá el ID visible del animal.");
    if (!form.especie) return setError("Seleccioná la especie.");
    if (!form.categoria.trim()) return setError("Ingresá la categoría.");
    if (!form.sexo.trim()) return setError("Ingresá el sexo.");
    if (!form.origen) return setError("Seleccioná el origen.");

    setLoading(true);
    try {
      const { addAnimal, updateAnimal } = await import("@/lib/api");

      const payload: AnimalInsert = {
        identificador: form.identificador.trim(),
        especie: form.especie,
        categoria: form.categoria.trim(),
        raza: form.raza.trim() || null,
        sexo: form.sexo.trim(),
        fecha_nac: form.fechaNac || null,
        estado: form.estado,
        sistema: form.sistema.trim() || null,
        ubicacion: form.ubicacion.trim() || null,
        origen: form.origen,
      };

      const saved = initialData
        ? await updateAnimal(initialData.id, payload)
        : await addAnimal(payload);

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
      <div
        className="w-full max-w-lg animate-fade-in modal-content"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          overflow: "hidden",
          margin: "auto",
        }}
      >
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
              <CowIcon size={20} style={{ color: "#fff" }} />
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
                {initialData ? "Editar Animal" : "Nuevo Animal"}
              </h2>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.65)",
                  marginTop: "1px",
                }}
              >
                {initialData ? "Actualizá la ficha del animal" : "Registrá un nuevo animal en el stock"}
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

        <form
          onSubmit={handleSubmit}
          style={{
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div>
              <label className="label">
                ID Animal <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text"
                name="identificador"
                value={form.identificador}
                onChange={handleChange}
                className="input"
                placeholder="Ej: BOV-0042"
                required
              />
            </div>
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
                {ESPECIES.map((especie) => (
                  <option key={especie} value={especie}>
                    {especie}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
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
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
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
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
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
                {ORIGENES.map((origen) => (
                  <option key={origen} value={origen}>
                    {origen}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="input"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
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
          </div>

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
              ) : initialData ? (
                "Guardar cambios"
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