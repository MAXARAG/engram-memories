import { supabase } from "@/lib/supabase";
import type {
  AnimalRow,
  AnimalInsert,
  AnimalUpdate,
  AlimentacionRow,
  AlimentacionInsert,
  SanidadRow,
  SanidadInsert,
  ReproduccionRow,
  ReproduccionInsert,
  DesteteRow,
  DesteteInsert,
  FaenaRow,
  FaenaInsert,
  MovimientoRow,
  MovimientoInsert,
  CostoRow,
  CostoInsert,
  StockAlimentoRow,
  StockAlimentoInsert,
  StockAlimentoUpdate,
  Stats,
  DashboardAlert,
  DashboardDetails,
  RecentEventType,
} from "@/types/database";

function normalizeAnimalError(error: { code?: string; message?: string } | null): Error {
  if (error?.code === "42703" && error.message?.includes("animales.identificador")) {
    return new Error(
      "La base de datos todavia no tiene el campo identificador en animales. Ejecuta el SQL de supabase/add_animales_identificador.sql en Supabase SQL Editor y volve a intentar."
    );
  }

  if (error?.code === "23505" && error.message?.toLowerCase().includes("identificador")) {
    return new Error("Ya existe un animal con ese ID visible. Usa otro identificador.");
  }

  return new Error(error?.message ?? "Error inesperado.");
}

// ─── Auth (Supabase Auth) ─────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function logout() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// ─── Animales ─────────────────────────────────────────────────────────────────

export async function getAnimales(estado?: string) {
  let query = supabase
    .from("animales")
    .select("*")
    .order("created_at", { ascending: false });

  if (estado && estado !== "all") {
    query = query.eq("estado", estado as import("@/types").AnimalEstado);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AnimalRow[];
}

export async function getAnimal(id: string) {
  const { data, error } = await supabase
    .from("animales")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as AnimalRow;
}

export async function addAnimal(payload: AnimalInsert) {
  const { data, error } = await supabase
    .from("animales")
    .insert(payload)
    .select()
    .single();

  if (error) throw normalizeAnimalError(error);
  return data as AnimalRow;
}

export async function updateAnimal(id: string, payload: AnimalUpdate) {
  const { data, error } = await supabase
    .from("animales")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw normalizeAnimalError(error);
  return data as AnimalRow;
}

export async function deleteAnimal(id: string) {
  const { error } = await supabase.from("animales").delete().eq("id", id);
  if (error) throw error;
}

// ─── Alimentacion ─────────────────────────────────────────────────────────────

export async function getAlimentacion() {
  const { data, error } = await supabase
    .from("alimentacion")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as AlimentacionRow[];
}

export async function addAlimentacion(payload: AlimentacionInsert) {
  const { data, error } = await supabase
    .from("alimentacion")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as AlimentacionRow;
}

export async function updateAlimentacion(id: string, payload: Partial<AlimentacionInsert>) {
  const { data, error } = await supabase
    .from("alimentacion")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AlimentacionRow;
}

export async function deleteAlimentacion(id: string) {
  const { error } = await supabase.from("alimentacion").delete().eq("id", id);
  if (error) throw error;
}

// ─── Sanidad ──────────────────────────────────────────────────────────────────

export async function getSanidad() {
  const { data, error } = await supabase
    .from("sanidad")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as SanidadRow[];
}

export async function addSanidad(payload: SanidadInsert) {
  const { data, error } = await supabase
    .from("sanidad")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as SanidadRow;
}

export async function updateSanidad(id: string, payload: Partial<SanidadInsert>) {
  const { data, error } = await supabase
    .from("sanidad")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as SanidadRow;
}

export async function deleteSanidad(id: string) {
  const { error } = await supabase.from("sanidad").delete().eq("id", id);
  if (error) throw error;
}

// ─── Reproduccion ─────────────────────────────────────────────────────────────

export async function getReproduccion() {
  const { data, error } = await supabase
    .from("reproduccion")
    .select("*")
    .order("fecha_servicio", { ascending: false });

  if (error) throw error;
  return data as ReproduccionRow[];
}

export async function addReproduccion(payload: ReproduccionInsert) {
  const { data, error } = await supabase
    .from("reproduccion")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as ReproduccionRow;
}

export async function updateReproduccion(id: string, payload: Partial<ReproduccionInsert>) {
  const { data, error } = await supabase
    .from("reproduccion")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ReproduccionRow;
}

export async function deleteReproduccion(id: string) {
  const { error } = await supabase.from("reproduccion").delete().eq("id", id);
  if (error) throw error;
}

// ─── Destete ──────────────────────────────────────────────────────────────────

export async function getDestete() {
  const { data, error } = await supabase
    .from("destete")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as DesteteRow[];
}

export async function addDestete(payload: DesteteInsert) {
  const { data, error } = await supabase
    .from("destete")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as DesteteRow;
}

export async function updateDestete(id: string, payload: Partial<DesteteInsert>) {
  const { data, error } = await supabase
    .from("destete")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DesteteRow;
}

export async function deleteDestete(id: string) {
  const { error } = await supabase.from("destete").delete().eq("id", id);
  if (error) throw error;
}

// ─── Faena ────────────────────────────────────────────────────────────────────

export async function getFaena() {
  const { data, error } = await supabase
    .from("faena")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as FaenaRow[];
}

export async function addFaena(payload: FaenaInsert) {
  const { data, error } = await supabase
    .from("faena")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as FaenaRow;
}

export async function updateFaena(id: string, payload: Partial<FaenaInsert>) {
  const { data, error } = await supabase
    .from("faena")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FaenaRow;
}

export async function deleteFaena(id: string) {
  const { error } = await supabase.from("faena").delete().eq("id", id);
  if (error) throw error;
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export async function getMovimientos() {
  const { data, error } = await supabase
    .from("movimientos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as MovimientoRow[];
}

export async function addMovimiento(payload: MovimientoInsert) {
  const { data, error } = await supabase
    .from("movimientos")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as MovimientoRow;
}

export async function updateMovimiento(id: string, payload: Partial<MovimientoInsert>) {
  const { data, error } = await supabase
    .from("movimientos")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as MovimientoRow;
}

export async function deleteMovimiento(id: string) {
  const { error } = await supabase.from("movimientos").delete().eq("id", id);
  if (error) throw error;
}

// ─── Costos ───────────────────────────────────────────────────────────────────

export async function getCostos() {
  const { data, error } = await supabase
    .from("costos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data as CostoRow[];
}

export async function addCosto(payload: CostoInsert) {
  const { data, error } = await supabase
    .from("costos")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as CostoRow;
}

export async function updateCosto(id: string, payload: Partial<CostoInsert>) {
  const { data, error } = await supabase
    .from("costos")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CostoRow;
}

export async function deleteCosto(id: string) {
  const { error } = await supabase.from("costos").delete().eq("id", id);
  if (error) throw error;
}

// ─── Stock Alimento ────────────────────────────────────────────────────────────

export async function getStockAlimento(): Promise<StockAlimentoRow[]> {
  const { data, error } = await supabase
    .from("stock_alimento")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StockAlimentoRow[];
}

export async function addStockAlimento(payload: StockAlimentoInsert): Promise<StockAlimentoRow> {
  const { data, error } = await supabase
    .from("stock_alimento")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as StockAlimentoRow;
}

export async function updateStockAlimento(id: string, payload: StockAlimentoUpdate): Promise<StockAlimentoRow> {
  const { data, error } = await supabase
    .from("stock_alimento")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as StockAlimentoRow;
}

export async function deleteStockAlimento(id: string): Promise<void> {
  const { error } = await supabase.from("stock_alimento").delete().eq("id", id);
  if (error) throw error;
}

// ─── Stats (calculado en cliente para evitar RPC/views) ───────────────────────

export async function getStats(): Promise<Stats> {
  const hoy = new Date();
  const en30 = new Date(hoy); en30.setDate(hoy.getDate() + 30);
  const en60 = new Date(hoy); en60.setDate(hoy.getDate() + 60);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [animalesRes, sanidadRes, reproRes, costosRes, alimentacionRes, desteteRes, faenaRes, movimientosRes] = await Promise.all([
    supabase.from("animales").select("id, especie, estado"),
    supabase.from("sanidad").select("fecha, dias_retiro"),
    supabase.from("reproduccion").select("fecha_parto"),
    supabase.from("costos").select("monto").gte("fecha", inicioMes),
    supabase.from("alimentacion").select("total_kg, costo_total, fecha"),
    supabase.from("destete").select("id"),
    supabase.from("faena").select("id"),
    supabase.from("movimientos").select("id"),
  ]);

  if (animalesRes.error) throw animalesRes.error;
  if (sanidadRes.error) throw sanidadRes.error;
  if (reproRes.error) throw reproRes.error;
  if (costosRes.error) throw costosRes.error;

  const activos = (animalesRes.data ?? []).filter((a) => a.estado === "Activo");

  const porEspecie = activos.reduce<Record<string, number>>((acc, a) => {
    acc[a.especie] = (acc[a.especie] ?? 0) + 1;
    return acc;
  }, {});

  const sanidadData = sanidadRes.data ?? [];

  const proximasVacunas = sanidadData.filter((s) => {
    if (!s.dias_retiro) return false;
    const base = new Date(s.fecha);
    const fin = new Date(base);
    fin.setDate(base.getDate() + s.dias_retiro);
    return fin >= hoy && fin <= en30;
  }).length;

  const animalesEnRetiro = sanidadData.filter((s) => {
    if (!s.dias_retiro || s.dias_retiro <= 0) return false;
    const base = new Date(s.fecha + "T12:00:00");
    const fin = new Date(base);
    fin.setDate(fin.getDate() + s.dias_retiro);
    const ahora = new Date();
    ahora.setHours(12, 0, 0, 0);
    return fin >= ahora;
  }).length;

  const reproData = reproRes.data ?? [];
  const partosEsperados = reproData.filter((r) => {
    if (!r.fecha_parto) return false;
    const fp = new Date(r.fecha_parto);
    return fp >= hoy && fp <= en60;
  }).length;

  const costosMes = (costosRes.data ?? []).reduce(
    (sum, c) => sum + (c.monto ?? 0),
    0
  );

  // Alimentación del mes
  const alimentacionData = alimentacionRes.data ?? [];
  const alimentacionMes = alimentacionData.filter((a) => a.fecha >= inicioMes);
  const alimentacionKgMes = alimentacionMes.reduce((s, a) => s + (a.total_kg ?? 0), 0);
  const alimentacionCostoMes = alimentacionMes.reduce((s, a) => s + (a.costo_total ?? 0), 0);

  return {
    totalActivos: activos.length,
    porEspecie: Object.entries(porEspecie).map(([especie, total]) => ({
      especie,
      total,
    })),
    proximasVacunas,
    partosEsperados,
    costosMes,
    totalAnimales: (animalesRes.data ?? []).length,
    totalSanidad: sanidadData.length,
    totalAlimentacion: alimentacionData.length,
    totalReproduccion: reproData.length,
    totalDestetes: (desteteRes.data ?? []).length,
    totalFaenas: (faenaRes.data ?? []).length,
    totalMovimientos: (movimientosRes.data ?? []).length,
    alimentacionKgMes,
    alimentacionCostoMes,
    animalesEnRetiro,
  };
}

// ─── Dashboard daily briefing ──────────────────────────────────────────────────

export async function getDashboardDetails(): Promise<DashboardDetails> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const hace7 = new Date(hoy);
  hace7.setDate(hoy.getDate() - 7);
  const hace7str = hace7.toISOString().split("T")[0];
  const hoyStr   = hoy.toISOString().split("T")[0];

  const [sanidadRes, reproRes, alimentRes, costosRes, desteteRes, faenaRes] = await Promise.all([
    supabase.from("sanidad").select("id, fecha, especie, tratamiento, tipo, dias_retiro").gt("dias_retiro", 0),
    supabase.from("reproduccion").select("id, especie, fecha_parto").not("fecha_parto", "is", null).gte("fecha_parto", hoyStr),
    supabase.from("alimentacion").select("id, fecha, especie, racion, total_kg").gte("fecha", hace7str).order("fecha", { ascending: false }).limit(6),
    supabase.from("costos").select("id, fecha, categoria, concepto, monto").gte("fecha", hace7str).order("fecha", { ascending: false }).limit(6),
    supabase.from("destete").select("id, fecha, especie, n_crias").gte("fecha", hace7str).order("fecha", { ascending: false }).limit(4),
    supabase.from("faena").select("id, fecha, especie, peso_canal").gte("fecha", hace7str).order("fecha", { ascending: false }).limit(4),
  ]);

  const alerts: DashboardAlert[] = [];

  // Retiro alerts — show when retiro ends in 0–7 days
  for (const s of sanidadRes.data ?? []) {
    if (!s.dias_retiro || s.dias_retiro <= 0) continue;
    const fin = new Date(s.fecha + "T12:00:00");
    fin.setDate(fin.getDate() + s.dias_retiro);
    fin.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);

    if (daysLeft >= 0 && daysLeft <= 7) {
      alerts.push({
        type: daysLeft === 0 ? "retiro_termina" : "retiro_activo",
        urgency: daysLeft === 0 ? "critical" : daysLeft <= 2 ? "warning" : "info",
        title: daysLeft === 0
          ? "Retiro termina hoy"
          : `Retiro en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
        detail: `${s.especie} — ${s.tratamiento}`,
        daysLeft,
        href: "/sanidad",
      });
    }
  }

  // Parto alerts — show when parto is in 0–14 days
  for (const r of reproRes.data ?? []) {
    if (!r.fecha_parto) continue;
    const fp = new Date(r.fecha_parto + "T12:00:00");
    fp.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((fp.getTime() - hoy.getTime()) / 86_400_000);

    if (daysLeft >= 0 && daysLeft <= 14) {
      alerts.push({
        type: "parto_proximo",
        urgency: daysLeft <= 1 ? "critical" : daysLeft <= 5 ? "warning" : "info",
        title: daysLeft === 0 ? "Parto hoy" : `Parto en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
        detail: r.especie,
        daysLeft,
        href: "/reproduccion",
      });
    }
  }

  // Sort: urgency first, then daysLeft
  const urgencyOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => {
    const uDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (uDiff !== 0) return uDiff;
    return (a.daysLeft ?? 99) - (b.daysLeft ?? 99);
  });

  // Recent activity from audit_logs (has who+what+when)
  const auditRes = await (supabase as any)
    .from("audit_logs")
    .select("id, action, actor_email, target_email, description, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  const TABLE_TO_TYPE: Record<string, RecentEventType> = {
    alimentacion: "alimentacion",
    sanidad: "sanidad",
    costos: "costo",
    reproduccion: "reproduccion",
    destete: "destete",
    faena: "faena",
    movimientos: "movimiento",
    animales: "movimiento",
    stock_alimento: "alimentacion",
  };

  const TABLE_LABEL: Record<string, string> = {
    alimentacion: "Alimentación",
    sanidad: "Sanidad",
    costos: "Costos",
    reproduccion: "Reproducción",
    destete: "Destete",
    faena: "Faena",
    movimientos: "Movimientos",
    animales: "Animales",
    stock_alimento: "Stock de alimentos",
  };

  const ACTION_LABEL: Record<string, string> = {
    insert: "Registro nuevo",
    update: "Modificación",
    delete: "Eliminación",
    create_user: "Usuario creado",
    delete_user: "Usuario eliminado",
    update_role: "Rol actualizado",
  };

  const auditLogs: any[] = auditRes.data ?? [];

  // Fallback to per-table query if audit_logs is empty (before triggers were set)
  const recentEvents: RecentEvent[] = auditLogs.length > 0
    ? auditLogs.map((log: any) => {
        const tableName: string = log.target_email ?? "";
        const evType: RecentEventType = TABLE_TO_TYPE[tableName] ?? "movimiento";
        const modLabel = TABLE_LABEL[tableName] ?? tableName;
        const actionLabel = ACTION_LABEL[log.action] ?? log.action;
        const actorName = log.actor_email ? log.actor_email.split("@")[0] : "Sistema";
        return {
          type: evType,
          date: log.created_at.split("T")[0],
          label: `${actionLabel} en ${modLabel}`,
          detail: log.description,
          actor: actorName,
          action: log.action,
        };
      })
    : [
        ...(alimentRes.data ?? []).map((a) => ({
          type: "alimentacion" as const,
          date: a.fecha,
          label: `Alimentación — ${a.especie}`,
          detail: `${a.racion} · ${a.total_kg?.toLocaleString("es-AR")} kg`,
        })),
        ...(costosRes.data ?? []).map((c) => ({
          type: "costo" as const,
          date: c.fecha,
          label: `Costos — ${c.categoria}`,
          detail: c.concepto,
        })),
        ...(desteteRes.data ?? []).map((d) => ({
          type: "destete" as const,
          date: d.fecha,
          label: `Destete — ${d.especie}`,
          detail: d.n_crias ? `${d.n_crias} cría${d.n_crias !== 1 ? "s" : ""}` : undefined,
        })),
        ...(faenaRes.data ?? []).map((f) => ({
          type: "faena" as const,
          date: f.fecha,
          label: `Faena — ${f.especie}`,
          detail: f.peso_canal ? `${f.peso_canal} kg en vara` : undefined,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return { alerts: alerts.slice(0, 12), recentEvents };
}
