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
  PesoRow,
  PesoInsert,
  SeguimientoRow,
  SeguimientoInsert,
  HistorialEntry,
  HistorialAnimal,
  Stats,
  DashboardAlert,
  DashboardDetails,
  RecentEventType,
  RecentEvent,
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

// ─── Seguimiento Tratamiento ──────────────────────────────────────────────────

export async function getSeguimientos(sanidadId: string): Promise<SeguimientoRow[]> {
  const { data, error } = await supabase
    .from("seguimiento_tratamiento")
    .select("*")
    .eq("sanidad_id", sanidadId)
    .order("fecha", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SeguimientoRow[];
}

export async function addSeguimiento(payload: SeguimientoInsert): Promise<SeguimientoRow> {
  const { data, error } = await supabase
    .from("seguimiento_tratamiento")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as SeguimientoRow;
}

export async function deleteSeguimiento(id: string): Promise<void> {
  const { error } = await supabase.from("seguimiento_tratamiento").delete().eq("id", id);
  if (error) throw error;
}

// ─── Pesos ────────────────────────────────────────────────────────────────────

export async function getPesos(animalId: string): Promise<PesoRow[]> {
  const { data, error } = await supabase
    .from("pesos")
    .select("*")
    .eq("animal_id", animalId)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PesoRow[];
}

export async function getUltimoPeso(animalId: string): Promise<PesoRow | null> {
  const { data, error } = await supabase
    .from("pesos")
    .select("*")
    .eq("animal_id", animalId)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PesoRow | null;
}

export async function addPeso(payload: PesoInsert): Promise<PesoRow> {
  const { data, error } = await supabase
    .from("pesos")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as PesoRow;
}

export async function deletePeso(id: string): Promise<void> {
  const { error } = await supabase.from("pesos").delete().eq("id", id);
  if (error) throw error;
}

// ─── Historial Animal ─────────────────────────────────────────────────────────

export async function getHistorialAnimal(animalId: string): Promise<HistorialAnimal> {
  // Traer datos del animal
  const animal = await getAnimal(animalId);

  // Traer todos los datos en paralelo
  const [pesosRes, sanidadRes, reproRes, desteteRes, faenaRes, movimientosRes] = await Promise.all([
    supabase.from("pesos").select("*").eq("animal_id", animalId).order("fecha", { ascending: false }),
    supabase.from("sanidad").select("*, seguimiento_tratamiento(*)").eq("animal_id", animalId).order("fecha", { ascending: false }),
    supabase.from("reproduccion").select("*").eq("animal_id", animalId).order("fecha_servicio", { ascending: false }),
    supabase.from("destete").select("*").or(`cria_id.eq.${animalId},madre_id.eq.${animalId}`).order("fecha", { ascending: false }),
    supabase.from("faena").select("*").eq("animal_id", animalId).order("fecha", { ascending: false }),
    supabase.from("movimientos").select("*").eq("animal_id", animalId).order("fecha", { ascending: false }),
  ]);

  const pesos = (pesosRes.data ?? []) as PesoRow[];
  const eventos: HistorialEntry[] = [];

  // Eventos de peso
  for (const p of pesos) {
    eventos.push({
      id: p.id,
      fecha: p.fecha,
      tipo: "peso",
      titulo: "Pesaje registrado",
      detalle: `${p.peso} kg`,
      datos: {
        peso: p.peso,
        observaciones: p.observaciones ?? null,
      },
      origen_tabla: "pesos",
      origen_id: p.id,
    });
  }

  // Eventos de sanidad + sus seguimientos
  for (const s of (sanidadRes.data ?? []) as unknown as (SanidadRow & { seguimiento_tratamiento?: SeguimientoRow[] })[]) {
    eventos.push({
      id: s.id,
      fecha: s.fecha,
      tipo: "sanidad",
      titulo: `${s.tipo}: ${s.tratamiento}`,
      detalle: (s.producto ? `${s.producto}` : "") + (s.dosis ? ` · ${s.dosis}` : "") + (s.responsable ? ` · Dr. ${s.responsable}` : ""),
      datos: {
        tipo: s.tipo,
        producto: s.producto ?? null,
        dosis: s.dosis ?? null,
        dias_retiro: s.dias_retiro,
        responsable: s.responsable ?? null,
        ...(s.temperatura != null ? { temperatura: `${s.temperatura} °C` } : {}),
        ...(s.peso_durante != null ? { peso_durante: `${s.peso_durante} kg` } : {}),
        ...(s.estado_tratamiento ? { estado: s.estado_tratamiento } : {}),
        ...(s.observaciones ? { observaciones: s.observaciones } : {}),
        ...(s.proxima_fecha ? { proxima_dosis: s.proxima_fecha } : {}),
      },
      origen_tabla: "sanidad",
      origen_id: s.id,
    });

    // Seguimientos del tratamiento como eventos separados
    for (const seg of (s.seguimiento_tratamiento ?? [])) {
      eventos.push({
        id: seg.id,
        fecha: seg.fecha,
        tipo: "sanidad",
        titulo: `Seguimiento: ${s.tratamiento}`,
        detalle: `Estado: ${seg.estado}` + (seg.temperatura != null ? ` · Temp: ${seg.temperatura}°C` : "") + (seg.peso != null ? ` · Peso: ${seg.peso}kg` : ""),
        datos: {
          estado: seg.estado,
          ...(seg.temperatura != null ? { temperatura: `${seg.temperatura} °C` } : {}),
          ...(seg.peso != null ? { peso: `${seg.peso} kg` } : {}),
          ...(seg.observaciones ? { observaciones: seg.observaciones } : {}),
        },
        origen_tabla: "seguimiento_tratamiento",
        origen_id: seg.id,
      });
    }
  }

  // Eventos de reproduccion
  for (const r of (reproRes.data ?? []) as ReproduccionRow[]) {
    eventos.push({
      id: r.id,
      fecha: r.fecha_servicio,
      tipo: "reproduccion",
      titulo: `Servicio ${r.tipo_servicio}`,
      detalle: (r.macho ? `Macho: ${r.macho}` : "") + (r.fecha_parto ? ` · Parto esperado: ${r.fecha_parto}` : "") + (r.diagnostico ? ` · ${r.diagnostico}` : ""),
      datos: {
        tipo_servicio: r.tipo_servicio,
        macho: r.macho ?? null,
        fecha_parto: r.fecha_parto ?? null,
        n_crias: r.n_crias,
        diagnostico: r.diagnostico ?? null,
      },
      origen_tabla: "reproduccion",
      origen_id: r.id,
    });
  }

  // Eventos de destete
  for (const d of (desteteRes.data ?? []) as DesteteRow[]) {
    const rol = d.cria_id === animalId ? "cría" : "madre";
    eventos.push({
      id: d.id,
      fecha: d.fecha,
      tipo: "destete",
      titulo: `Destete (como ${rol})`,
      detalle: `${d.n_crias} cría${d.n_crias !== 1 ? "s" : ""} · Peso promedio: ${d.peso_promedio} kg · Destino: ${d.destino}`,
      datos: {
        n_crias: d.n_crias,
        peso_total: d.peso_total,
        peso_promedio: d.peso_promedio,
        destino: d.destino,
      },
      origen_tabla: "destete",
      origen_id: d.id,
    });
  }

  // Eventos de faena
  for (const f of (faenaRes.data ?? []) as FaenaRow[]) {
    eventos.push({
      id: f.id,
      fecha: f.fecha,
      tipo: "faena",
      titulo: "Faena",
      detalle: `Peso vivo: ${f.peso_vivo} kg · Peso canal: ${f.peso_canal} kg` + (f.rendimiento ? ` · Rendimiento: ${f.rendimiento}%` : ""),
      datos: {
        peso_vivo: f.peso_vivo,
        peso_canal: f.peso_canal,
        rendimiento: f.rendimiento ?? null,
        observaciones: f.observaciones ?? null,
      },
      origen_tabla: "faena",
      origen_id: f.id,
    });
  }

  // Eventos de movimientos
  for (const m of (movimientosRes.data ?? []) as MovimientoRow[]) {
    eventos.push({
      id: m.id,
      fecha: m.fecha,
      tipo: "movimiento",
      titulo: `Movimiento: ${m.tipo}`,
      detalle: (m.motivo ? m.motivo : "") + (m.destino ? ` · Destino: ${m.destino}` : "") + (m.observaciones ? ` · ${m.observaciones}` : ""),
      datos: {
        tipo: m.tipo,
        motivo: m.motivo ?? null,
        destino: m.destino ?? null,
      },
      origen_tabla: "movimientos",
      origen_id: m.id,
    });
  }

  // Ordenar todos los eventos por fecha descendente
  eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  return {
    animal,
    ultimoPeso: pesos[0] ?? null,
    historialPesos: pesos,
    eventos,
  };
}

export async function getHistorialPorLote(lote: string): Promise<{ animales: AnimalRow[]; eventos: HistorialEntry[] }> {
  // Buscar todos los animales del lote
  const { data: animalesData, error: animalesError } = await supabase
    .from("animales")
    .select("*")
    .eq("lote", lote)
    .order("identificador");

  if (animalesError) throw animalesError;
  const animales = (animalesData ?? []) as AnimalRow[];

  if (animales.length === 0) return { animales: [], eventos: [] };

  const ids = animales.map((a) => a.id);

  // Traer todos los eventos de todos los animales del lote
  const [pesosRes, sanidadRes, reproRes, faenaRes, movimientosRes] = await Promise.all([
    supabase.from("pesos").select("*, animales(identificador)").in("animal_id", ids).order("fecha", { ascending: false }),
    supabase.from("sanidad").select("*, animales(identificador)").in("animal_id", ids).order("fecha", { ascending: false }),
    supabase.from("reproduccion").select("*, animales(identificador)").in("animal_id", ids).order("fecha_servicio", { ascending: false }),
    supabase.from("faena").select("*, animales(identificador)").in("animal_id", ids).order("fecha", { ascending: false }),
    supabase.from("movimientos").select("*, animales(identificador)").in("animal_id", ids).order("fecha", { ascending: false }),
  ]);

  const eventos: HistorialEntry[] = [];

  for (const p of (pesosRes.data ?? []) as (PesoRow & { animales?: { identificador: string } })[]) {
    const id_label = p.animales?.identificador ?? p.animal_id;
    eventos.push({ id: p.id, fecha: p.fecha, tipo: "peso", titulo: `Pesaje — Animal ${id_label}`, detalle: `${p.peso} kg`, origen_tabla: "pesos", origen_id: p.id });
  }

  for (const s of (sanidadRes.data ?? []) as (SanidadRow & { animales?: { identificador: string } })[]) {
    const id_label = s.animales?.identificador ?? s.animal_id ?? "lote";
    eventos.push({ id: s.id, fecha: s.fecha, tipo: "sanidad", titulo: `${s.tipo} — Animal ${id_label}`, detalle: s.tratamiento + (s.producto ? ` · ${s.producto}` : ""), origen_tabla: "sanidad", origen_id: s.id });
  }

  for (const r of (reproRes.data ?? []) as (ReproduccionRow & { animales?: { identificador: string } })[]) {
    const id_label = r.animales?.identificador ?? r.animal_id ?? "lote";
    eventos.push({ id: r.id, fecha: r.fecha_servicio, tipo: "reproduccion", titulo: `Servicio ${r.tipo_servicio} — Animal ${id_label}`, detalle: r.macho ? `Macho: ${r.macho}` : "", origen_tabla: "reproduccion", origen_id: r.id });
  }

  for (const f of (faenaRes.data ?? []) as (FaenaRow & { animales?: { identificador: string } })[]) {
    const id_label = f.animales?.identificador ?? f.animal_id ?? "lote";
    eventos.push({ id: f.id, fecha: f.fecha, tipo: "faena", titulo: `Faena — Animal ${id_label}`, detalle: `Peso vivo: ${f.peso_vivo} kg · Canal: ${f.peso_canal} kg`, origen_tabla: "faena", origen_id: f.id });
  }

  for (const m of (movimientosRes.data ?? []) as (MovimientoRow & { animales?: { identificador: string } })[]) {
    const id_label = m.animales?.identificador ?? m.animal_id ?? "lote";
    eventos.push({ id: m.id, fecha: m.fecha, tipo: "movimiento", titulo: `${m.tipo} — Animal ${id_label}`, detalle: (m.motivo ?? "") + (m.destino ? ` · ${m.destino}` : ""), origen_tabla: "movimientos", origen_id: m.id });
  }

  eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  return { animales, eventos };
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
    supabase.from("sanidad").select("id, fecha, especie, tratamiento, tipo, dias_retiro, proxima_fecha"),
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

  // Alertas de tratamientos pendientes (proxima_fecha)
  for (const s of sanidadRes.data ?? []) {
    if (!s.proxima_fecha) continue;
    const fp = new Date(s.proxima_fecha + "T12:00:00");
    fp.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((fp.getTime() - hoy.getTime()) / 86_400_000);

    if (daysLeft >= 0 && daysLeft <= 14) {
      alerts.push({
        type: "tratamiento_pendiente",
        urgency: daysLeft === 0 ? "critical" : daysLeft <= 3 ? "warning" : "info",
        title: daysLeft === 0 ? "Tratamiento pendiente HOY" : `Tratamiento en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
        detail: `${s.especie} — ${s.tratamiento}`,
        daysLeft,
        href: "/sanidad",
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
