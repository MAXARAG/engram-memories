"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ClipboardList,
  Weight,
  Syringe,
  Wheat,
  Heart,
  Baby,
  Scissors,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
} from "lucide-react";
import type { AnimalRow, HistorialAnimal, HistorialEntry, TipoEventoHistorial } from "@/types/database";
import { CowIcon } from "@/components/icons/CowIcon";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

const TIPO_CONFIG: Record<TipoEventoHistorial, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  peso:         { label: "Pesaje",        color: "#1d4ed8", bg: "#dbeafe", Icon: Weight       },
  sanidad:      { label: "Sanidad",       color: "#7c3aed", bg: "#ede9fe", Icon: Syringe      },
  alimentacion: { label: "Alimentación",  color: "#065f46", bg: "#d1fae5", Icon: Wheat        },
  reproduccion: { label: "Reproducción",  color: "#9d174d", bg: "#fce7f3", Icon: Heart        },
  destete:      { label: "Destete",       color: "#92400e", bg: "#fef3c7", Icon: Baby         },
  faena:        { label: "Faena",         color: "#7f1d1d", bg: "#fee2e2", Icon: Scissors     },
  movimiento:   { label: "Movimiento",    color: "#1e3a5f", bg: "#dbeafe", Icon: ArrowLeftRight },
  cambio_datos: { label: "Cambio datos",  color: "#374151", bg: "#f3f4f6", Icon: ClipboardList },
};

const ESTADO_COLOR: Record<string, string> = {
  Activo:  "#166534",
  Vendido: "#92400e",
  Muerto:  "#7f1d1d",
  Faenado: "#374151",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonReporte() {
  return (
    <div className="card animate-fade-in" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {[80, 60, 100, 70, 85, 65].map((w, i) => (
        <div key={i} className="skeleton-bar" style={{ width: `${w}%`, height: 16 }} />
      ))}
    </div>
  );
}

// ─── Evento Card ──────────────────────────────────────────────────────────────

function EventoCard({ evento }: { evento: HistorialEntry }) {
  const [open, setOpen] = useState(false);
  const config = TIPO_CONFIG[evento.tipo] ?? TIPO_CONFIG.cambio_datos;
  const { Icon } = config;

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      {/* Timeline dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: config.bg,
            border: `2px solid ${config.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>
      </div>

      {/* Contenido */}
      <div
        style={{
          flex: 1,
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            cursor: evento.datos ? "pointer" : "default",
          }}
          onClick={() => evento.datos && setOpen((v) => !v)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: config.color,
                  background: config.bg,
                  padding: "0.15rem 0.5rem",
                  borderRadius: 999,
                }}
              >
                {config.label}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                {formatDate(evento.fecha)}
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>{evento.titulo}</p>
            {evento.detalle && (
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{evento.detalle}</p>
            )}
          </div>
          {evento.datos && (
            <div style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
        </div>

        {/* Detalles expandibles */}
        {open && evento.datos && (
          <div
            className="animate-fade-in"
            style={{
              borderTop: "1px solid var(--color-border)",
              padding: "0.75rem 1rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.5rem",
            }}
          >
            {Object.entries(evento.datos)
              .filter(([, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => (
                <div key={k}>
                  <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {k.replace(/_/g, " ")}
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text)", fontWeight: 500 }}>{String(v)}</p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reporte Animal ───────────────────────────────────────────────────────────

function ReporteAnimal({ data }: { data: HistorialAnimal }) {
  const { animal, ultimoPeso, eventos } = data;

  const estadoColor = ESTADO_COLOR[animal.estado] ?? "#374151";

  return (
    <div className="animate-fade-in">
      {/* ── Ficha Header ── */}
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {/* Franja superior */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CowIcon size={26} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Animal #{animal.identificador}
              </h2>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: "rgba(255,255,255,0.2)",
                  padding: "0.2rem 0.7rem",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {animal.estado}
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", marginTop: "0.25rem" }}>
              {animal.especie} · {animal.categoria}
              {animal.raza ? ` · ${animal.raza}` : ""}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Expediente generado
            </div>
            <div style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              {formatDate(new Date().toISOString().split("T")[0])}
            </div>
          </div>
        </div>

        {/* Grilla de datos generales */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 0,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {[
            { label: "Sexo",            value: animal.sexo },
            { label: "Origen",          value: animal.origen },
            { label: "Lote / Camada",   value: animal.lote || "—" },
            { label: "Sistema",         value: animal.sistema || "—" },
            { label: "Fecha Nac.",      value: formatDate(animal.fecha_nac) },
            { label: "Último pesaje",   value: ultimoPeso ? `${ultimoPeso.peso} kg · ${formatDate(ultimoPeso.fecha)}` : "Sin pesajes" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                padding: "0.875rem 1.25rem",
                borderRight: "1px solid var(--color-border)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
                {f.label}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)" }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Historial de pesos ── */}
      {data.historialPesos.length > 0 && (
        <div className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary-dark)", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Weight size={16} style={{ color: "var(--color-primary)" }} />
            Historial de Pesos
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {data.historialPesos.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#dbeafe",
                  border: "1px solid #93c5fd",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem 0.875rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 90,
                }}
              >
                <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1d4ed8" }}>{p.peso} kg</span>
                <span style={{ fontSize: "0.7rem", color: "#1e40af", marginTop: "0.1rem" }}>{formatDate(p.fecha)}</span>
                {p.observaciones && (
                  <span style={{ fontSize: "0.6875rem", color: "#3b82f6", marginTop: "0.1rem", textAlign: "center" }}>{p.observaciones}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timeline de eventos ── */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-primary-dark)",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClipboardList size={16} style={{ color: "var(--color-primary)" }} />
            Historial Completo
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
            {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
          </span>
        </h3>

        {eventos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p>Sin eventos registrados para este animal.</p>
          </div>
        ) : (
          <div>
            {eventos.map((ev) => (
              <EventoCard key={`${ev.origen_tabla}-${ev.origen_id}`} evento={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reporte Lote ─────────────────────────────────────────────────────────────

function ReporteLote({ animales, eventos, lote }: { animales: AnimalRow[]; eventos: HistorialEntry[]; lote: string }) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div
        className="card"
        style={{ marginBottom: "1.25rem", padding: 0, overflow: "hidden" }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#fff" }}>
              Lote: {lote}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)", marginTop: "0.25rem" }}>
              {animales.length} {animales.length === 1 ? "animal" : "animales"} · {eventos.length} eventos totales
            </p>
          </div>
        </div>
        {/* Animales del lote */}
        <div style={{ padding: "1rem 1.5rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {animales.map((a) => (
            <span
              key={a.id}
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 999,
                padding: "0.2rem 0.75rem",
                color: "var(--color-text)",
              }}
            >
              #{a.identificador} · {a.especie}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-primary-dark)",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClipboardList size={16} style={{ color: "var(--color-primary)" }} />
            Historial del Lote
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
            {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
          </span>
        </h3>
        {eventos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
            <p>Sin eventos registrados para este lote.</p>
          </div>
        ) : (
          <div>
            {eventos.map((ev) => (
              <EventoCard key={`${ev.origen_tabla}-${ev.origen_id}`} evento={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function HistorialContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [animales, setAnimales] = useState<AnimalRow[]>([]);
  const [loadingAnimales, setLoadingAnimales] = useState(true);
  const [historial, setHistorial] = useState<HistorialAnimal | null>(null);
  const [loteData, setLoteData] = useState<{ animales: AnimalRow[]; eventos: HistorialEntry[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchAnimal, setSearchAnimal] = useState("");
  const [searchLote, setSearchLote] = useState("");
  const [modo, setModo] = useState<"animal" | "lote">("animal");
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");

  // Precargar desde query param ?animal=
  useEffect(() => {
    const aid = searchParams.get("animal");
    if (aid) {
      setSelectedAnimalId(aid);
      setModo("animal");
    }
  }, [searchParams]);

  // Cargar lista de animales para selector
  useEffect(() => {
    import("@/lib/api").then(({ getAnimales }) =>
      getAnimales().then((rows) => {
        setAnimales(rows);
        setLoadingAnimales(false);
      })
    );
  }, []);

  // Si viene ?animal= cargar historial automáticamente
  useEffect(() => {
    if (selectedAnimalId && !loadingAnimales) {
      cargarHistorialAnimal(selectedAnimalId);
    }
  }, [selectedAnimalId, loadingAnimales]);

  const cargarHistorialAnimal = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setHistorial(null);
    setLoteData(null);
    try {
      const { getHistorialAnimal } = await import("@/lib/api");
      const data = await getHistorialAnimal(id);
      setHistorial(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorialLote = useCallback(async (lote: string) => {
    if (!lote.trim()) return;
    setLoading(true);
    setError(null);
    setHistorial(null);
    setLoteData(null);
    try {
      const { getHistorialPorLote } = await import("@/lib/api");
      const data = await getHistorialPorLote(lote.trim());
      if (data.animales.length === 0) {
        setError(`No se encontraron animales en el lote "${lote.trim()}".`);
      } else {
        setLoteData(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtrar animales para buscador
  const animalesFiltrados = animales.filter((a) => {
    const q = searchAnimal.toLowerCase();
    return (
      a.identificador.toLowerCase().includes(q) ||
      a.especie.toLowerCase().includes(q) ||
      (a.lote ?? "").toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const loteOptions = Array.from(new Set(animales.map((a) => a.lote).filter(Boolean))).sort() as string[];

  return (
    <div className="module-page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <ClipboardList size={28} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            Historial
          </h1>
          <p className="page-subtitle">Expediente completo por animal o por lote</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["animal", "lote"] as const).map((m) => (
            <button
              key={m}
              className={`btn ${modo === m ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: "0.875rem" }}
              onClick={() => { setModo(m); setHistorial(null); setLoteData(null); setError(null); }}
            >
              {m === "animal" ? "🐄 Por Animal" : "📦 Por Lote"}
            </button>
          ))}
        </div>

        {modo === "animal" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label className="label">Buscar animal por ID, especie o lote</label>
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: 922, Porcino, Lote A..."
                  value={searchAnimal}
                  onChange={(e) => setSearchAnimal(e.target.value)}
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
            {searchAnimal && animalesFiltrados.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                }}
              >
                {animalesFiltrados.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAnimalId(a.id);
                      setSearchAnimal("");
                      router.replace(`/historial?animal=${a.id}`);
                    }}
                    style={{
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      background: "var(--color-bg-card)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg-card)")}
                  >
                    <CowIcon size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>#{a.identificador}</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                        {" "}· {a.especie} · {a.categoria}
                        {a.lote ? ` · Lote: ${a.lote}` : ""}
                      </span>
                    </div>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: ESTADO_COLOR[a.estado] ?? "#374151",
                        background: "#f3f4f6",
                        padding: "0.15rem 0.5rem",
                        borderRadius: 999,
                      }}
                    >
                      {a.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedAnimalId && !searchAnimal && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {(() => {
                  const a = animales.find((x) => x.id === selectedAnimalId);
                  return a ? (
                    <>
                      <span style={{ fontSize: "0.875rem", color: "var(--color-text)" }}>
                        <strong>#{a.identificador}</strong> — {a.especie} · {a.categoria}
                      </span>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", padding: "0.2rem 0.5rem" }}
                        onClick={() => { setSelectedAnimalId(""); setHistorial(null); router.replace("/historial"); }}
                      >
                        <X size={12} /> Limpiar
                      </button>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="label">Lote / Camada</label>
              <input
                type="text"
                className="input"
                list="lotes-list"
                placeholder="Escribí o seleccioná un lote..."
                value={searchLote}
                onChange={(e) => setSearchLote(e.target.value)}
              />
              <datalist id="lotes-list">
                {loteOptions.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => cargarHistorialLote(searchLote)}
              disabled={!searchLote.trim() || loading}
            >
              Buscar
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="card animate-fade-in"
          style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <AlertCircle size={18} style={{ color: "var(--color-error)", flexShrink: 0 }} />
          <p style={{ fontSize: "0.875rem", color: "var(--color-error)" }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && <SkeletonReporte />}

      {/* Resultado */}
      {!loading && historial && <ReporteAnimal data={historial} />}
      {!loading && loteData && <ReporteLote animales={loteData.animales} eventos={loteData.eventos} lote={searchLote} />}

      {/* Empty state inicial */}
      {!loading && !historial && !loteData && !error && (
        <div className="card">
          <div className="empty-state">
            <ClipboardList className="empty-state-icon" size={56} />
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary-dark)", marginBottom: "0.375rem" }}>
              Seleccioná un animal o lote
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              Buscá por ID de animal o por lote para ver el expediente completo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistorialPage() {
  return (
    <Suspense fallback={<div className="module-page"><div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>Cargando...</div></div>}>
      <HistorialContent />
    </Suspense>
  );
}
