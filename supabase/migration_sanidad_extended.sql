-- ============================================================
-- VaniApp - Migración: Sanidad extendida
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Nuevos campos de seguimiento del animal
ALTER TABLE sanidad
  ADD COLUMN IF NOT EXISTS observaciones text,
  ADD COLUMN IF NOT EXISTS temperatura numeric,
  ADD COLUMN IF NOT EXISTS peso_durante numeric,
  ADD COLUMN IF NOT EXISTS estado_tratamiento text DEFAULT 'completado';

-- 2. Campos de repetición / próxima dosis
ALTER TABLE sanidad
  ADD COLUMN IF NOT EXISTS proxima_fecha date,
  ADD COLUMN IF NOT EXISTS frecuencia_dias int;

-- 3. Índice para buscar tratamientos con fecha próxima pendiente
CREATE INDEX IF NOT EXISTS idx_sanidad_proxima_fecha ON sanidad(proxima_fecha)
  WHERE proxima_fecha IS NOT NULL;
