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
