-- ══════════════════════════════════════════════════════════════════════════════
-- VaniApp — Schema inicial para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE animal_estado    AS ENUM ('Activo', 'Vendido', 'Muerto', 'Faenado');
CREATE TYPE animal_origen    AS ENUM ('Nacido', 'Comprado');
CREATE TYPE tipo_servicio    AS ENUM ('Natural', 'Inseminación');
CREATE TYPE destino_destete  AS ENUM ('Recría', 'Venta', 'Engorde');
CREATE TYPE tipo_movimiento  AS ENUM ('Alta', 'Baja', 'Traslado');
CREATE TYPE tipo_costo       AS ENUM ('Fijo', 'Variable');
CREATE TYPE tipo_sanidad     AS ENUM ('Vacuna', 'Tratamiento', 'Desparasitación', 'Otro');

-- ─── Animales (tabla principal / stock) ──────────────────────────────────────

CREATE TABLE animales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificador text NOT NULL UNIQUE,
  especie     text NOT NULL,
  categoria   text NOT NULL,
  raza        text,
  sexo        text NOT NULL,
  fecha_nac   date,
  estado      animal_estado NOT NULL DEFAULT 'Activo',
  sistema     text,
  ubicacion   text,
  origen      animal_origen NOT NULL DEFAULT 'Nacido',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_animales_estado   ON animales (estado);
CREATE INDEX idx_animales_especie  ON animales (especie);
CREATE UNIQUE INDEX idx_animales_identificador ON animales (identificador);

-- Actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER animales_updated_at
  BEFORE UPDATE ON animales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Alimentacion ────────────────────────────────────────────────────────────

CREATE TABLE alimentacion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha       date NOT NULL,
  especie     text NOT NULL,
  categoria   text NOT NULL,
  racion      text NOT NULL,
  kg_animal   numeric(10,3) NOT NULL CHECK (kg_animal > 0),
  cantidad    int NOT NULL CHECK (cantidad > 0),
  total_kg    numeric(12,3) NOT NULL,
  costo_kg    numeric(12,2) NOT NULL DEFAULT 0,
  costo_total numeric(14,2) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alimentacion_fecha ON alimentacion (fecha DESC);

-- ─── Sanidad ─────────────────────────────────────────────────────────────────

CREATE TABLE sanidad (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        date NOT NULL,
  animal_id    uuid REFERENCES animales (id) ON DELETE SET NULL,
  especie      text NOT NULL,
  tratamiento  text NOT NULL,
  producto     text,
  dosis        text,
  tipo         tipo_sanidad NOT NULL DEFAULT 'Vacuna',
  dias_retiro  int NOT NULL DEFAULT 0,
  responsable  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sanidad_animal_id ON sanidad (animal_id);
CREATE INDEX idx_sanidad_fecha     ON sanidad (fecha DESC);

-- ─── Reproduccion ────────────────────────────────────────────────────────────

CREATE TABLE reproduccion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid REFERENCES animales (id) ON DELETE SET NULL,
  especie         text NOT NULL,
  fecha_servicio  date NOT NULL,
  macho           text,
  tipo_servicio   tipo_servicio NOT NULL DEFAULT 'Natural',
  diagnostico     text,
  fecha_parto     date,
  n_crias         int NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reproduccion_animal_id   ON reproduccion (animal_id);
CREATE INDEX idx_reproduccion_fecha_parto ON reproduccion (fecha_parto);

-- ─── Destete ─────────────────────────────────────────────────────────────────

CREATE TABLE destete (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha         date NOT NULL,
  cria_id       uuid REFERENCES animales (id) ON DELETE SET NULL,
  madre_id      uuid REFERENCES animales (id) ON DELETE SET NULL,
  especie       text NOT NULL,
  n_crias       int NOT NULL DEFAULT 1,
  peso_total    numeric(10,2) NOT NULL DEFAULT 0,
  peso_promedio numeric(10,2) NOT NULL DEFAULT 0,
  destino       destino_destete NOT NULL DEFAULT 'Recría',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_destete_fecha ON destete (fecha DESC);

-- ─── Faena ───────────────────────────────────────────────────────────────────

CREATE TABLE faena (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha          date NOT NULL,
  animal_id      uuid REFERENCES animales (id) ON DELETE SET NULL,
  especie        text NOT NULL,
  peso_vivo      numeric(10,2) NOT NULL,
  peso_canal     numeric(10,2) NOT NULL,
  rendimiento    numeric(5,2) GENERATED ALWAYS AS
                   (CASE WHEN peso_vivo > 0 THEN ROUND(peso_canal / peso_vivo * 100, 2) ELSE 0 END)
                   STORED,
  observaciones  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_faena_animal_id ON faena (animal_id);
CREATE INDEX idx_faena_fecha     ON faena (fecha DESC);

-- ─── Movimientos ─────────────────────────────────────────────────────────────

CREATE TABLE movimientos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha          date NOT NULL,
  animal_id      uuid REFERENCES animales (id) ON DELETE SET NULL,
  tipo           tipo_movimiento NOT NULL,
  motivo         text,
  destino        text,
  observaciones  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimientos_animal_id ON movimientos (animal_id);
CREATE INDEX idx_movimientos_fecha     ON movimientos (fecha DESC);

-- ─── Costos ──────────────────────────────────────────────────────────────────

CREATE TABLE costos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha      date NOT NULL,
  categoria  text NOT NULL,
  concepto   text NOT NULL,
  especie    text,
  monto      numeric(14,2) NOT NULL,
  tipo       tipo_costo NOT NULL DEFAULT 'Variable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_costos_fecha ON costos (fecha DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Habilitá RLS en cada tabla. Solo usuarios autenticados pueden leer/escribir.

ALTER TABLE animales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimentacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanidad       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduccion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE destete       ENABLE ROW LEVEL SECURITY;
ALTER TABLE faena         ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos        ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados (auth.uid() no es null)
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'animales','alimentacion','sanidad','reproduccion',
      'destete','faena','movimientos','costos'
    ])
  LOOP
    EXECUTE format('
      CREATE POLICY "auth_only" ON %I
        FOR ALL TO authenticated
        USING (auth.uid() IS NOT NULL)
        WITH CHECK (auth.uid() IS NOT NULL);
    ', t);
  END LOOP;
END;
$$;
