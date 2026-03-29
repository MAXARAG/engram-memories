-- ──────────────────────────────────────────────────────────────────────────────
-- stock_alimento: inventario de alimentos con control de stock y próxima compra
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_alimento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,              -- "Maíz molido", "Pellet bovino", etc.
  unidad        text NOT NULL DEFAULT 'kg', -- 'kg' | 'lt' | 'bolsa' | 'fardo'
  stock_actual  numeric(12,2) NOT NULL DEFAULT 0,
  stock_minimo  numeric(12,2) NOT NULL DEFAULT 0,  -- alerta cuando baje de este valor
  stock_optimo  numeric(12,2),             -- nivel objetivo post-compra
  proveedor     text,
  precio_unidad numeric(12,2),             -- precio por unidad (kg, lt, etc.)
  notas         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE stock_alimento ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stock_alimento_updated_at
  BEFORE UPDATE ON stock_alimento
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índice
CREATE INDEX IF NOT EXISTS stock_alimento_nombre_idx ON stock_alimento (nombre);
