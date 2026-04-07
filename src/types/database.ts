// ─── Enum types ──────────────────────────────────────────────────────────────

export type TipoEventoHistorial =
  | "peso"
  | "sanidad"
  | "alimentacion"
  | "reproduccion"
  | "destete"
  | "faena"
  | "movimiento"
  | "cambio_datos";

export type AnimalEstado = "Activo" | "Vendido" | "Muerto" | "Faenado";
export type AnimalOrigen = "Nacido" | "Comprado";
export type TipoServicio = "Natural" | "Inseminación";
export type DestinoDestete = "Recría" | "Venta" | "Engorde";
export type TipoMovimiento = "Alta" | "Baja" | "Traslado";
export type TipoCosto = "Fijo" | "Variable";
export type TipoSanidad = "Vacuna" | "Tratamiento" | "Desparasitación" | "Otro";

// ─── Enums / scalars usados dentro del Database type ────────────────────────
export type UnidadStock = "kg" | "lt" | "bolsa" | "fardo";

// ─── Database type (formato supabase CLI — compatible con supabase-js 2.x) ───

export type Database = {
  public: {
    Tables: {
      animales: {
        Row: {
          id: string;
          identificador: string;
          especie: string;
          categoria: string;
          raza: string | null;
          sexo: string;
          fecha_nac: string | null;
          estado: AnimalEstado;
          sistema: string | null;
          lote: string | null;
          origen: AnimalOrigen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          identificador: string;
          especie: string;
          categoria: string;
          raza?: string | null;
          sexo: string;
          fecha_nac?: string | null;
          estado?: AnimalEstado;
          sistema?: string | null;
          lote?: string | null;
          origen?: AnimalOrigen;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identificador?: string;
          especie?: string;
          categoria?: string;
          raza?: string | null;
          sexo?: string;
          fecha_nac?: string | null;
          estado?: AnimalEstado;
          sistema?: string | null;
          lote?: string | null;
          origen?: AnimalOrigen;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alimentacion: {
        Row: {
          id: string;
          fecha: string;
          especie: string;
          categoria: string;
          racion: string;
          kg_animal: number;
          cantidad: number;
          total_kg: number;
          costo_kg: number;
          costo_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          especie: string;
          categoria: string;
          racion: string;
          kg_animal: number;
          cantidad: number;
          total_kg: number;
          costo_kg?: number;
          costo_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          especie?: string;
          categoria?: string;
          racion?: string;
          kg_animal?: number;
          cantidad?: number;
          total_kg?: number;
          costo_kg?: number;
          costo_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      sanidad: {
        Row: {
          id: string;
          fecha: string;
          animal_id: string | null;
          especie: string;
          tratamiento: string;
          producto: string | null;
          dosis: string | null;
          tipo: TipoSanidad;
          dias_retiro: number;
          responsable: string | null;
          // Seguimiento del animal
          observaciones: string | null;
          temperatura: number | null;
          peso_durante: number | null;
          estado_tratamiento: string | null;
          // Repetición
          proxima_fecha: string | null;
          frecuencia_dias: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          animal_id?: string | null;
          especie: string;
          tratamiento: string;
          producto?: string | null;
          dosis?: string | null;
          tipo?: TipoSanidad;
          dias_retiro?: number;
          responsable?: string | null;
          observaciones?: string | null;
          temperatura?: number | null;
          peso_durante?: number | null;
          estado_tratamiento?: string | null;
          proxima_fecha?: string | null;
          frecuencia_dias?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          animal_id?: string | null;
          especie?: string;
          tratamiento?: string;
          producto?: string | null;
          dosis?: string | null;
          tipo?: TipoSanidad;
          dias_retiro?: number;
          responsable?: string | null;
          observaciones?: string | null;
          temperatura?: number | null;
          peso_durante?: number | null;
          estado_tratamiento?: string | null;
          proxima_fecha?: string | null;
          frecuencia_dias?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reproduccion: {
        Row: {
          id: string;
          animal_id: string | null;
          especie: string;
          fecha_servicio: string;
          macho: string | null;
          tipo_servicio: TipoServicio;
          diagnostico: string | null;
          fecha_parto: string | null;
          n_crias: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id?: string | null;
          especie: string;
          fecha_servicio: string;
          macho?: string | null;
          tipo_servicio?: TipoServicio;
          diagnostico?: string | null;
          fecha_parto?: string | null;
          n_crias?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string | null;
          especie?: string;
          fecha_servicio?: string;
          macho?: string | null;
          tipo_servicio?: TipoServicio;
          diagnostico?: string | null;
          fecha_parto?: string | null;
          n_crias?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      destete: {
        Row: {
          id: string;
          fecha: string;
          cria_id: string | null;
          madre_id: string | null;
          especie: string;
          n_crias: number;
          peso_total: number;
          peso_promedio: number;
          destino: DestinoDestete;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          cria_id?: string | null;
          madre_id?: string | null;
          especie: string;
          n_crias?: number;
          peso_total?: number;
          peso_promedio?: number;
          destino?: DestinoDestete;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          cria_id?: string | null;
          madre_id?: string | null;
          especie?: string;
          n_crias?: number;
          peso_total?: number;
          peso_promedio?: number;
          destino?: DestinoDestete;
          created_at?: string;
        };
        Relationships: [];
      };
      faena: {
        Row: {
          id: string;
          fecha: string;
          animal_id: string | null;
          especie: string;
          peso_vivo: number;
          peso_canal: number;
          rendimiento: number;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          animal_id?: string | null;
          especie: string;
          peso_vivo: number;
          peso_canal: number;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          animal_id?: string | null;
          especie?: string;
          peso_vivo?: number;
          peso_canal?: number;
          observaciones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      movimientos: {
        Row: {
          id: string;
          fecha: string;
          animal_id: string | null;
          tipo: TipoMovimiento;
          motivo: string | null;
          destino: string | null;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          animal_id?: string | null;
          tipo: TipoMovimiento;
          motivo?: string | null;
          destino?: string | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          animal_id?: string | null;
          tipo?: TipoMovimiento;
          motivo?: string | null;
          destino?: string | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      costos: {
        Row: {
          id: string;
          fecha: string;
          categoria: string;
          concepto: string;
          especie: string | null;
          monto: number;
          tipo: TipoCosto;
          created_at: string;
        };
        Insert: {
          id?: string;
          fecha: string;
          categoria: string;
          concepto: string;
          especie?: string | null;
          monto: number;
          tipo?: TipoCosto;
          created_at?: string;
        };
        Update: {
          id?: string;
          fecha?: string;
          categoria?: string;
          concepto?: string;
          especie?: string | null;
          monto?: number;
          tipo?: TipoCosto;
          created_at?: string;
        };
        Relationships: [];
      };
      seguimiento_tratamiento: {
        Row: {
          id: string;
          sanidad_id: string;
          fecha: string;
          temperatura: number | null;
          peso: number | null;
          estado: string;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sanidad_id: string;
          fecha: string;
          temperatura?: number | null;
          peso?: number | null;
          estado?: string;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sanidad_id?: string;
          fecha?: string;
          temperatura?: number | null;
          peso?: number | null;
          estado?: string;
          observaciones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pesos: {
        Row: {
          id: string;
          animal_id: string;
          fecha: string;
          peso: number;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          fecha: string;
          peso: number;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          fecha?: string;
          peso?: number;
          observaciones?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stock_alimento: {
        Row: {
          id: string;
          nombre: string;
          unidad: UnidadStock;
          stock_actual: number;
          stock_minimo: number;
          stock_optimo: number | null;
          proveedor: string | null;
          precio_unidad: number | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          unidad?: UnidadStock;
          stock_actual?: number;
          stock_minimo?: number;
          stock_optimo?: number | null;
          proveedor?: string | null;
          precio_unidad?: number | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          unidad?: UnidadStock;
          stock_actual?: number;
          stock_minimo?: number;
          stock_optimo?: number | null;
          proveedor?: string | null;
          precio_unidad?: number | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Row / Insert / Update aliases (derivados del Database type) ─────────────

export type AnimalRow = Database["public"]["Tables"]["animales"]["Row"];
export type AnimalInsert = Database["public"]["Tables"]["animales"]["Insert"];
export type AnimalUpdate = Database["public"]["Tables"]["animales"]["Update"];

export type AlimentacionRow = Database["public"]["Tables"]["alimentacion"]["Row"];
export type AlimentacionInsert = Database["public"]["Tables"]["alimentacion"]["Insert"];
export type AlimentacionUpdate = Database["public"]["Tables"]["alimentacion"]["Update"];

export type SanidadRow = Database["public"]["Tables"]["sanidad"]["Row"];
export type SanidadInsert = Database["public"]["Tables"]["sanidad"]["Insert"];
export type SanidadUpdate = Database["public"]["Tables"]["sanidad"]["Update"];

export type ReproduccionRow = Database["public"]["Tables"]["reproduccion"]["Row"];
export type ReproduccionInsert = Database["public"]["Tables"]["reproduccion"]["Insert"];
export type ReproduccionUpdate = Database["public"]["Tables"]["reproduccion"]["Update"];

export type DesteteRow = Database["public"]["Tables"]["destete"]["Row"];
export type DesteteInsert = Database["public"]["Tables"]["destete"]["Insert"];
export type DesteteUpdate = Database["public"]["Tables"]["destete"]["Update"];

export type FaenaRow = Database["public"]["Tables"]["faena"]["Row"];
export type FaenaInsert = Database["public"]["Tables"]["faena"]["Insert"];
export type FaenaUpdate = Database["public"]["Tables"]["faena"]["Update"];

export type MovimientoRow = Database["public"]["Tables"]["movimientos"]["Row"];
export type MovimientoInsert = Database["public"]["Tables"]["movimientos"]["Insert"];
export type MovimientoUpdate = Database["public"]["Tables"]["movimientos"]["Update"];

export type CostoRow = Database["public"]["Tables"]["costos"]["Row"];
export type CostoInsert = Database["public"]["Tables"]["costos"]["Insert"];
export type CostoUpdate = Database["public"]["Tables"]["costos"]["Update"];

export type StockAlimentoRow = Database["public"]["Tables"]["stock_alimento"]["Row"];
export type StockAlimentoInsert = Database["public"]["Tables"]["stock_alimento"]["Insert"];
export type StockAlimentoUpdate = Database["public"]["Tables"]["stock_alimento"]["Update"];

export type SeguimientoRow    = Database["public"]["Tables"]["seguimiento_tratamiento"]["Row"];
export type SeguimientoInsert = Database["public"]["Tables"]["seguimiento_tratamiento"]["Insert"];
export type SeguimientoUpdate = Database["public"]["Tables"]["seguimiento_tratamiento"]["Update"];

export type PesoRow = Database["public"]["Tables"]["pesos"]["Row"];
export type PesoInsert = Database["public"]["Tables"]["pesos"]["Insert"];
export type PesoUpdate = Database["public"]["Tables"]["pesos"]["Update"];

// ─── Stats (calculado en cliente, no tabla) ───────────────────────────────────

export interface StatsEspecie {
  especie: string;
  total: number;
}

export interface Stats {
  totalActivos: number;
  porEspecie: StatsEspecie[];
  proximasVacunas: number;
  partosEsperados: number;
  costosMes: number;
  // Extended stats
  totalAnimales: number;
  totalSanidad: number;
  totalAlimentacion: number;
  totalReproduccion: number;
  totalDestetes: number;
  totalFaenas: number;
  totalMovimientos: number;
  alimentacionKgMes: number;
  alimentacionCostoMes: number;
  animalesEnRetiro: number;
}

// ─── Dashboard daily briefing ─────────────────────────────────────────────────

export interface DashboardAlert {
  type: "retiro_termina" | "retiro_activo" | "parto_proximo" | "tratamiento_pendiente";
  urgency: "critical" | "warning" | "info";
  title: string;
  detail: string;
  daysLeft?: number;
  href: string;
}

export type RecentEventType = "alimentacion" | "sanidad" | "costo" | "reproduccion" | "destete" | "faena" | "movimiento";

export interface RecentEvent {
  type: RecentEventType;
  date: string;
  label: string;
  detail?: string;
  actor?: string;
  action?: string;
}

export interface DashboardDetails {
  alerts: DashboardAlert[];
  recentEvents: RecentEvent[];
}

// ─── Historial de Animal ──────────────────────────────────────────────────────

export interface HistorialEntry {
  id: string;
  fecha: string;
  tipo: TipoEventoHistorial;
  titulo: string;
  detalle: string;
  datos?: Record<string, string | number | null>;
  origen_tabla: string;
  origen_id: string;
}

export interface HistorialAnimal {
  animal: AnimalRow;
  ultimoPeso: PesoRow | null;
  historialPesos: PesoRow[];
  eventos: HistorialEntry[];
}

