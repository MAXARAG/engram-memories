"use client";

import { useState, useEffect } from "react";
import { X, Package, ChevronDown } from "lucide-react";
import type { StockAlimentoRow, StockAlimentoInsert, UnidadStock } from "@/types/database";

const UNIDADES: { value: UnidadStock; label: string }[] = [
  { value: "kg",    label: "Kilogramos (kg)" },
  { value: "lt",    label: "Litros (lt)" },
  { value: "bolsa", label: "Bolsas" },
  { value: "fardo", label: "Fardos" },
];

interface StockAlimentoModalProps {
  initialData?: StockAlimentoRow | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  nombre: string;
  unidad: UnidadStock;
  stock_actual: string;
  stock_minimo: string;
  stock_optimo: string;
  proveedor: string;
  precio_unidad: string;
  notas: string;
}

const EMPTY: FormState = {
  nombre: "",
  unidad: "kg",
  stock_actual: "",
  stock_minimo: "",
  stock_optimo: "",
  proveedor: "",
  precio_unidad: "",
  notas: "",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function StockAlimentoModal({ initialData, onClose, onSaved }: StockAlimentoModalProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre:       initialData.nombre,
        unidad:       initialData.unidad,
        stock_actual: initialData.stock_actual.toString(),
        stock_minimo: initialData.stock_minimo.toString(),
        stock_optimo: initialData.stock_optimo?.toString() ?? "",
        proveedor:    initialData.proveedor ?? "",
        precio_unidad: initialData.precio_unidad?.toString() ?? "",
        notas:        initialData.notas ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [initialData]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (form.stock_actual === "" || isNaN(Number(form.stock_actual))) { setError("Stock actual inválido."); return; }
    if (form.stock_minimo === "" || isNaN(Number(form.stock_minimo))) { setError("Stock mínimo inválido."); return; }

    const payload: StockAlimentoInsert = {
      nombre:       form.nombre.trim(),
      unidad:       form.unidad,
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      stock_optimo: form.stock_optimo ? Number(form.stock_optimo) : null,
      proveedor:    form.proveedor.trim() || null,
      precio_unidad: form.precio_unidad ? Number(form.precio_unidad) : null,
      notas:        form.notas.trim() || null,
    };

    setSaving(true);
    try {
      if (isEditing && initialData) {
        const { updateStockAlimento } = await import("@/lib/api");
        await updateStockAlimento(initialData.id, payload);
      } else {
        const { addStockAlimento } = await import("@/lib/api");
        await addStockAlimento(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    marginBottom: "0.375rem",
  };

  const fieldStyle = { display: "flex", flexDirection: "column" as const };

  const unidadLabel = UNIDADES.find(u => u.value === form.unidad)?.label ?? form.unidad;

  // Calculo días para próxima compra
  const stockActualNum = Number(form.stock_actual) || 0;
  const stockMinimoNum = Number(form.stock_minimo) || 0;
  const stockOptimoNum = Number(form.stock_optimo) || 0;
  const stockPct = stockMinimoNum > 0
    ? Math.min(100, Math.round((stockActualNum / (stockOptimoNum || stockMinimoNum * 2)) * 100))
    : 0;
  const estadoStock: "ok" | "bajo" | "critico" =
    stockActualNum <= 0
      ? "critico"
      : stockActualNum <= stockMinimoNum
      ? "bajo"
      : "ok";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: "rgba(30, 61, 26, 0.6)", backdropFilter: "blur(4px)", overflowY: "auto" }}
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
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={18} color="#fff" />
            </div>
            <div>
              <h2 style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.0625rem" }}>
                {isEditing ? "Editar producto" : "Nuevo producto en stock"}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>
                Control de inventario de alimentos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "var(--radius-md)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Stock preview bar (si ya hay datos) */}
          {form.stock_actual && form.stock_minimo && (
            <div style={{
              background: estadoStock === "ok" ? "#f0fdf4" : estadoStock === "bajo" ? "#fffbeb" : "#fef2f2",
              borderRadius: "var(--radius-lg)",
              padding: "0.875rem 1rem",
              border: `1px solid ${estadoStock === "ok" ? "#bbf7d0" : estadoStock === "bajo" ? "#fde68a" : "#fecaca"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: estadoStock === "ok" ? "#15803d" : estadoStock === "bajo" ? "#92400e" : "#991b1b" }}>
                  {estadoStock === "ok" ? "✓ Stock suficiente" : estadoStock === "bajo" ? "⚠ Stock bajo mínimo" : "✗ Sin stock"}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  {stockActualNum} / {stockOptimoNum || "—"} {form.unidad}
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${stockPct}%`,
                  borderRadius: 99,
                  background: estadoStock === "ok" ? "#22c55e" : estadoStock === "bajo" ? "#f59e0b" : "#ef4444",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}

          {/* Nombre + Unidad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nombre del producto *</label>
              <input style={inputStyle} value={form.nombre} onChange={set("nombre")} placeholder="Ej: Maíz molido, Pellet bovino…" required />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Unidad de medida</label>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputStyle, appearance: "none", paddingRight: "2rem" }} value={form.unidad} onChange={set("unidad")}>
                  {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }} />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Proveedor</label>
              <input style={inputStyle} value={form.proveedor} onChange={set("proveedor")} placeholder="Nombre del proveedor" />
            </div>
          </div>

          {/* Stocks */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stock actual ({form.unidad}) *</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.stock_actual} onChange={set("stock_actual")} placeholder="0" required />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stock mínimo ({form.unidad}) *</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.stock_minimo} onChange={set("stock_minimo")} placeholder="0" required />
              <span style={{ fontSize: "0.73rem", color: "var(--color-text-muted)", marginTop: 2 }}>Alerta al bajar de esto</span>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Stock óptimo ({form.unidad})</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.stock_optimo} onChange={set("stock_optimo")} placeholder="Objetivo compra" />
            </div>
          </div>

          {/* Precio */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Precio por {form.unidad} ($/{ form.unidad })</label>
            <input style={{ ...inputStyle, maxWidth: 200 }} type="number" min="0" step="0.01" value={form.precio_unidad} onChange={set("precio_unidad")} placeholder="0.00" />
          </div>

          {/* Notas */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Notas</label>
            <textarea
              style={{ ...inputStyle, minHeight: 68, resize: "vertical", fontFamily: "inherit" }}
              value={form.notas}
              onChange={set("notas")}
              placeholder="Observaciones, condiciones de almacenamiento, etc."
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#991b1b", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.25rem" }}>
            <button type="button" onClick={onClose}
              style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer", fontSize: "0.9375rem", fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ padding: "0.5rem 1.5rem", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.9375rem", fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar al inventario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
