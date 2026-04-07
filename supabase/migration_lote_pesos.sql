-- ============================================================
-- VaniApp - Migración: Lote + Tabla Pesos
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Renombrar columna ubicacion -> lote en tabla animales
ALTER TABLE animales RENAME COLUMN ubicacion TO lote;

-- 2. Crear tabla pesos (histórico de pesajes por animal)
CREATE TABLE IF NOT EXISTS pesos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid REFERENCES animales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  peso numeric NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_pesos_animal ON pesos(animal_id);
CREATE INDEX IF NOT EXISTS idx_pesos_fecha ON pesos(fecha DESC);

-- 4. Habilitar RLS
ALTER TABLE pesos ENABLE ROW LEVEL SECURITY;

-- 5. Policy para usuarios autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pesos' 
    AND policyname = 'Usuarios autenticados pueden gestionar pesos'
  ) THEN
    CREATE POLICY "Usuarios autenticados pueden gestionar pesos" ON pesos
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END
$$;
