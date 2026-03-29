"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wheat, Plus, Filter, X, PackageOpen, ChevronDown, Clock,
  Package, AlertTriangle, ShoppingCart,
} from "lucide-react";
import type { AlimentacionRow, StockAlimentoRow } from "@/types/database";
import { AlimentacionModal } from "@/components/alimentacion/AlimentacionModal";
import { StockAlimentoModal } from "@/components/alimentacion/StockAlimentoModal";
import { RowActions } from "@/components/common/RowActions";

type Tab = "registros" | "stock";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatKg(n: number): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " kg";
}

function formatMoney(n: number): string {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlimentacionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("registros");

  // ── Registros state ──────────────────────────────────────────────────────────
  const [records, setRecords] = useState<AlimentacionRow[]>([]);
  const [loadingReg, setLoadingReg] = useState(true);
  const [errorReg, setErrorReg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AlimentacionRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterEspecie, setFilterEspecie] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");

  // ── Stock state ──────────────────────────────────────────────────────────────
  const [stock, setStock] = useState<StockAlimentoRow[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [errorStock, setErrorStock] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockAlimentoRow | null>(null);
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);

  // ── Load registros ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingReg(true);
      setErrorReg(null);
      try {
        const { getAlimentacion } = await import("@/lib/api");
        const rows = await getAlimentacion();
        if (!cancelled) setRecords(rows);
      } catch (e) {
        if (!cancelled) setErrorReg(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoadingReg(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Load stock (lazy: only when tab activated) ────────────────────────────
  const [stockLoaded, setStockLoaded] = useState(false);
  useEffect(() => {
    if (activeTab !== "stock") return;
    if (stockLoaded) return;
    let cancelled = false;
    async function load() {
      setLoadingStock(true);
      setErrorStock(null);
      try {
        const { getStockAlimento } = await import("@/lib/api");
        const rows = await getStockAlimento();
        if (!cancelled) { setStock(rows); setStockLoaded(true); }
      } catch (e) {
        if (!cancelled) setErrorStock(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        if (!cancelled) setLoadingStock(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeTab, stockLoaded]);

  function reloadStock() { setStockLoaded(false); }

  // ── Registros helpers ────────────────────────────────────────────────────────
  const especieOptions = useMemo(() => Array.from(new Set(records.map((r) => r.especie))).sort(), [records]);
  const categoriaOptions = useMemo(() => Array.from(new Set(records.map((r) => r.categoria))).sort(), [records]);

  const filtered = useMemo(() => records.filter((r) => {
    if (filterEspecie && r.especie !== filterEspecie) return false;
    if (filterCategoria && r.categoria !== filterCategoria) return false;
    if (filterDesde && r.fecha < filterDesde) return false;
    if (filterHasta && r.fecha > filterHasta) return false;
    return true;
  }), [records, filterEspecie, filterCategoria, filterDesde, filterHasta]);

  const hasFilters = !!(filterEspecie || filterCategoria || filterDesde || filterHasta);
  function clearFilters() { setFilterEspecie(""); setFilterCategoria(""); setFilterDesde(""); setFilterHasta(""); }

  function handleSaved(record: AlimentacionRow) {
    setRecords((prev) => {
      const exists = prev.some((item) => item.id === record.id);
      if (!exists) return [record, ...prev];
      return prev.map((item) => (item.id === record.id ? record : item));
    });
    setSelectedRecord(null);
    setShowModal(false);
  }

  function openCreateModal() { setSelectedRecord(null); setShowModal(true); }
  function openEditModal(r: AlimentacionRow) { setSelectedRecord(r); setShowModal(true); }

  async function handleDelete(record: AlimentacionRow) {
    if (!window.confirm(`Eliminar la carga de alimentación del ${formatDate(record.fecha)}?`)) return;
    setDeletingId(record.id);
    setErrorReg(null);
    try {
      const { deleteAlimentacion } = await import("@/lib/api");
      await deleteAlimentacion(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
    } catch (e) {
      setErrorReg(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Stock helpers ────────────────────────────────────────────────────────────
  const stockAlertas = useMemo(() => stock.filter(s => s.stock_actual <= s.stock_minimo), [stock]);

  async function handleDeleteStock(item: StockAlimentoRow) {
    if (!window.confirm(`Eliminar ${item.nombre} del inventario?`)) return;
    setDeletingStockId(item.id);
    setErrorStock(null);
    try {
      const { deleteStockAlimento } = await import("@/lib/api");
      await deleteStockAlimento(item.id);
      setStock((prev) => prev.filter((s) => s.id !== item.id));
    } catch (e) {
      setErrorStock(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setDeletingStockId(null);
    }
  }

  // ── Stats helpers ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (records.length === 0) return null;

    // KG y costo por especie
    const byEspecie: Record<string, { kg: number; costo: number; registros: number }> = {};
    records.forEach(r => {
      if (!byEspecie[r.especie]) byEspecie[r.especie] = { kg: 0, costo: 0, registros: 0 };
      byEspecie[r.especie].kg += r.total_kg;
      byEspecie[r.especie].costo += r.costo_total;
      byEspecie[r.especie].registros++;
    });

    // Top raciones
    const byRacion: Record<string, { kg: number; registros: number }> = {};
    records.forEach(r => {
      if (!byRacion[r.racion]) byRacion[r.racion] = { kg: 0, registros: 0 };
      byRacion[r.racion].kg += r.total_kg;
      byRacion[r.racion].registros++;
    });
    const topRaciones = Object.entries(byRacion).sort((a, b) => b[1].kg - a[1].kg).slice(0, 5);

    // KG por mes (últimos 6 meses)
    const byMes: Record<string, number> = {};
    records.forEach(r => {
      const mes = r.fecha.slice(0, 7); // yyyy-mm
      byMes[mes] = (byMes[mes] || 0) + r.total_kg;
    });
    const meses = Object.entries(byMes).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    const maxKgMes = Math.max(...meses.map(m => m[1]), 1);

    // Totales
    const totalKg = records.reduce((s, r) => s + r.total_kg, 0);
    const totalCosto = records.reduce((s, r) => s + r.costo_total, 0);
    const promKgAnimal = records.reduce((s, r) => s + r.kg_animal, 0) / records.length;

    return { byEspecie, topRaciones, meses, maxKgMes, totalKg, totalCosto, promKgAnimal };
  }, [records]);

  // ── FAB action per tab ───────────────────────────────────────────────────────
  const fabAction = activeTab === "stock"
    ? () => { setSelectedStock(null); setShowStockModal(true); }
    : openCreateModal;
  const fabLabel = activeTab === "stock" ? "Nuevo producto" : "Nueva Carga";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "registros", label: "Registros", icon: <Clock size={15} /> },
    { id: "stock", label: "Stock", icon: <Package size={15} /> },
  ];

  return (
    <>
      <div className="module-page animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
              <div style={{ background: "var(--color-primary-muted)", borderRadius: "var(--radius-md)", padding: "0.375rem", display: "flex", color: "var(--color-primary)" }}>
                <Wheat size={20} />
              </div>
              <h1 className="page-title">Alimentación</h1>
            </div>
            <p className="page-subtitle">Registros, inventario y estadísticas de alimentación</p>
          </div>
          {activeTab === "registros" && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)} style={{ position: "relative" }}>
                <Filter size={15} /> Filtros
                {hasFilters && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />}
                <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showFilters ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
                <Plus size={16} /> Nueva Carga
              </button>
            </div>
          )}
          {activeTab === "stock" && (
            <button className="btn btn-primary hide-mobile" onClick={() => { setSelectedStock(null); setShowStockModal(true); }}>
              <Plus size={16} /> Nuevo Producto
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", borderBottom: "2px solid var(--color-border)", marginBottom: "1.5rem" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.625rem 1rem",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                marginBottom: -2,
                color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-muted)",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: REGISTROS ── */}
        {activeTab === "registros" && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <Clock size={17} style={{ color: "var(--color-primary)" }} />
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-primary-dark)" }}>Historial de cargas</h2>
                {!loadingReg && !errorReg && <span className="count-badge">{filtered.length}{hasFilters && ` / ${records.length}`}</span>}
              </div>
            </div>

            {errorReg && (
              <div className="animate-fade-in" style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", color: "var(--color-error)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <X size={18} style={{ flexShrink: 0 }} /> <p style={{ fontSize: "0.9375rem" }}>{errorReg}</p>
              </div>
            )}

            {showFilters && (
              <div className="card animate-fade-in" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filtros</p>
                  {hasFilters && <button className="btn btn-ghost" onClick={clearFilters} style={{ fontSize: "0.8125rem" }}><X size={13} /> Limpiar</button>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.875rem" }}>
                  <div><label className="label">Especie</label><select className="input" value={filterEspecie} onChange={(e) => setFilterEspecie(e.target.value)}><option value="">Todas</option>{especieOptions.map(e => <option key={e} value={e}>{e}</option>)}</select></div>
                  <div><label className="label">Categoría</label><select className="input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}><option value="">Todas</option>{categoriaOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="label">Desde</label><input type="date" className="input" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} /></div>
                  <div><label className="label">Hasta</label><input type="date" className="input" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} /></div>
                </div>
              </div>
            )}

            {loadingReg ? (
              <div className="record-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-bar" style={{ width: "50%", marginBottom: "0.75rem" }} />
                    <div className="skeleton-bar" style={{ width: "80%", marginBottom: "0.5rem" }} />
                    <div className="skeleton-bar" style={{ width: "60%" }} />
                  </div>
                ))}
              </div>
            ) : !errorReg && filtered.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  {records.length === 0 ? (
                    <>
                      <PackageOpen className="empty-state-icon" size={56} />
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin registros de alimentación</p>
                      <p style={{ fontSize: "0.9rem" }}>Usá <strong>Nueva Carga</strong> para agregar el primero.</p>
                    </>
                  ) : (
                    <>
                      <Filter className="empty-state-icon" size={48} />
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin resultados</p>
                      <button className="btn btn-secondary" style={{ marginTop: "0.75rem" }} onClick={clearFilters}><X size={14} /> Limpiar filtros</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="record-grid">
                {filtered.map((r, idx) => (
                  <div key={r.id ?? idx} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                    <div className="record-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Wheat size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                        <span className="record-card-title">{r.racion}</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{formatDate(r.fecha)}</span>
                    </div>
                    <div className="record-card-meta">
                      <span className="badge badge-green">{r.especie}</span>
                      <span className="badge badge-gray">{r.categoria}</span>
                    </div>
                    <div className="record-card-body">
                      <div className="record-card-field">
                        <span className="record-card-label">Kg/Animal</span>
                        <span className="record-card-value">{r.kg_animal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Cantidad</span>
                        <span className="record-card-value">{r.cantidad.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Total KG</span>
                        <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-primary-dark)" }}>{formatKg(r.total_kg)}</span>
                      </div>
                      <div className="record-card-field">
                        <span className="record-card-label">Costo Total</span>
                        <span className="record-card-value" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-accent)" }}>{formatMoney(r.costo_total)}</span>
                      </div>
                    </div>
                    <div className="record-card-actions">
                      <RowActions onEdit={() => openEditModal(r)} onDelete={() => handleDelete(r)} deleting={deletingId === r.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingReg && !errorReg && filtered.length > 0 && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-light)", marginTop: "0.75rem", textAlign: "right" }}>
                {filtered.length} {filtered.length === 1 ? "registro" : "registros"}{hasFilters && ` (de ${records.length})`}
              </p>
            )}
          </section>
        )}

        {/* ── TAB: STOCK ── */}
        {activeTab === "stock" && (
          <section>
            {/* Alertas */}
            {stockAlertas.length > 0 && (
              <div className="animate-fade-in" style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9375rem" }}>
                    {stockAlertas.length} {stockAlertas.length === 1 ? "producto con stock bajo mínimo" : "productos con stock bajo mínimo"}
                  </p>
                  <p style={{ color: "#b45309", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {stockAlertas.map(s => s.nombre).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {errorStock && (
              <div className="animate-fade-in" style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", color: "var(--color-error)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <X size={18} style={{ flexShrink: 0 }} /> <p style={{ fontSize: "0.9375rem" }}>{errorStock}</p>
              </div>
            )}

            {loadingStock ? (
              <div className="record-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-bar" style={{ width: "60%", marginBottom: "0.75rem" }} />
                    <div className="skeleton-bar" style={{ width: "40%", marginBottom: "0.5rem" }} />
                    <div className="skeleton-bar" style={{ width: "80%" }} />
                  </div>
                ))}
              </div>
            ) : stock.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <Package className="empty-state-icon" size={56} />
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>Sin productos en inventario</p>
                  <p style={{ fontSize: "0.9rem" }}>Agregá alimentos para controlar el stock.</p>
                </div>
              </div>
            ) : (
              <div className="record-grid">
                {stock.map((s, idx) => {
                  const pct = s.stock_optimo && s.stock_optimo > 0
                    ? Math.min(100, Math.round((s.stock_actual / s.stock_optimo) * 100))
                    : s.stock_minimo > 0
                    ? Math.min(100, Math.round((s.stock_actual / (s.stock_minimo * 2)) * 100))
                    : 0;
                  const estado: "ok" | "bajo" | "critico" =
                    s.stock_actual <= 0 ? "critico" : s.stock_actual <= s.stock_minimo ? "bajo" : "ok";
                  const barColor = estado === "ok" ? "#22c55e" : estado === "bajo" ? "#f59e0b" : "#ef4444";
                  const compraNeeded = s.stock_optimo
                    ? Math.max(0, s.stock_optimo - s.stock_actual)
                    : Math.max(0, s.stock_minimo * 2 - s.stock_actual);

                  return (
                    <div key={s.id} className="record-card animate-fade-in" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                      <div className="record-card-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Package size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                          <span className="record-card-title">{s.nombre}</span>
                        </div>
                        <span style={{
                          fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: 99,
                          background: estado === "ok" ? "#dcfce7" : estado === "bajo" ? "#fef3c7" : "#fee2e2",
                          color: estado === "ok" ? "#16a34a" : estado === "bajo" ? "#d97706" : "#dc2626",
                        }}>
                          {estado === "ok" ? "OK" : estado === "bajo" ? "BAJO" : "CRÍTICO"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ margin: "0.625rem 0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--color-text-muted)", marginBottom: "0.3rem" }}>
                          <span>{s.stock_actual} {s.unidad} actual</span>
                          <span>mín: {s.stock_minimo} {s.unidad}</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barColor, transition: "width 0.4s ease" }} />
                        </div>
                      </div>

                      <div className="record-card-body">
                        {s.proveedor && (
                          <div className="record-card-field">
                            <span className="record-card-label">Proveedor</span>
                            <span className="record-card-value">{s.proveedor}</span>
                          </div>
                        )}
                        {s.precio_unidad != null && (
                          <div className="record-card-field">
                            <span className="record-card-label">Precio/{s.unidad}</span>
                            <span className="record-card-value">{formatMoney(s.precio_unidad)}</span>
                          </div>
                        )}
                        {compraNeeded > 0 && (
                          <div className="record-card-field" style={{ gridColumn: "1 / -1" }}>
                            <span className="record-card-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <ShoppingCart size={12} /> Para reponer
                            </span>
                            <span className="record-card-value" style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                              {compraNeeded.toLocaleString("es-AR", { maximumFractionDigits: 1 })} {s.unidad}
                              {s.precio_unidad != null ? ` (${formatMoney(compraNeeded * s.precio_unidad)})` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="record-card-actions">
                        <RowActions
                          onEdit={() => { setSelectedStock(s); setShowStockModal(true); }}
                          onDelete={() => handleDeleteStock(s)}
                          deleting={deletingStockId === s.id}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Estadísticas: removed — tab hidden per request */}
      </div>

      {/* FAB */}
      <button className="fab" onClick={fabAction} aria-label={fabLabel}>
        <Plus size={24} />
      </button>

      {/* Modal Registros */}
      {showModal && (
        <AlimentacionModal
          initialData={selectedRecord}
          onClose={() => { setSelectedRecord(null); setShowModal(false); }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal Stock */}
      {showStockModal && (
        <StockAlimentoModal
          initialData={selectedStock}
          onClose={() => { setSelectedStock(null); setShowStockModal(false); }}
          onSaved={reloadStock}
        />
      )}
    </>
  );
}
