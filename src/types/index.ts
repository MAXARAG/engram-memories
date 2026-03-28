// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}

// ─── Animal (STOCK) ──────────────────────────────────────────────────────────

export type AnimalOrigen = "Nacido" | "Comprado";
export type AnimalEstado = "Activo" | "Vendido" | "Muerto" | "Faenado";

export interface Animal {
  idAnimal: string;
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

// ─── Alimentacion ────────────────────────────────────────────────────────────

export interface Alimentacion {
  id?: string;
  fecha: string;
  especie: string;
  categoria: string;
  racion: string;
  kgAnimal: number;
  cantidad: number;
  totalKg: number;
  costoKg: number;
  costoTotal: number;
}

// ─── Sanidad ─────────────────────────────────────────────────────────────────

export interface Sanidad {
  id?: string;
  fecha: string;
  idAnimal: string;
  especie: string;
  tratamiento: string;
  producto: string;
  dosis: string;
  tipo: string;
  diasRetiro: number;
  responsable: string;
}

// ─── Reproduccion ────────────────────────────────────────────────────────────

export type TipoServicio = "Natural" | "Inseminación";

export interface Reproduccion {
  id?: string;
  idMadre: string;
  especie: string;
  fechaServicio: string;
  macho: string;
  tipoServicio: TipoServicio;
  diagnostico: string;
  fechaParto: string;
  nCrias: number;
}

// ─── Destete ─────────────────────────────────────────────────────────────────

export type DestinoDestete = "Recría" | "Venta" | "Engorde";

export interface Destete {
  id?: string;
  fecha: string;
  idCria: string;
  madre: string;
  especie: string;
  nCrias: number;
  peso: number;
  promedio: number;
  destino: DestinoDestete;
}

// ─── Faena ───────────────────────────────────────────────────────────────────

export interface Faena {
  id?: string;
  fecha: string;
  idAnimal: string;
  especie: string;
  pesoVivo: number;
  pesoCanal: number;
  rendimiento: number;
  observaciones: string;
}

// ─── Movimiento ──────────────────────────────────────────────────────────────

export type TipoMovimiento = "Alta" | "Baja" | "Traslado";

export interface Movimiento {
  id?: string;
  fecha: string;
  idAnimal: string;
  tipo: TipoMovimiento;
  motivo: string;
  destino: string;
  observaciones: string;
}

// ─── Costo ───────────────────────────────────────────────────────────────────

export type TipoCosto = "Fijo" | "Variable";

export interface Costo {
  id?: string;
  fecha: string;
  categoria: string;
  concepto: string;
  especie: string;
  monto: number;
  tipo: TipoCosto;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface StatsEspecie {
  especie: string;
  total: number;
}

export interface Stats {
  totalAnimales: number;
  porEspecie: StatsEspecie[];
  proximasVacunas: number;
  partosEsperados: number;
  costosMes: number;
  ultimaActualizacion: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  username: string;
  nombre?: string;
  rol?: string;
  token?: string;
}
