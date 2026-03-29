-- Ejecutar en Supabase SQL Editor sobre una base existente
-- Agrega el identificador visible del animal sin romper registros actuales

ALTER TABLE public.animales
ADD COLUMN IF NOT EXISTS identificador text;

UPDATE public.animales
SET identificador = 'ANM-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE identificador IS NULL OR BTRIM(identificador) = '';

ALTER TABLE public.animales
ALTER COLUMN identificador SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_animales_identificador'
  ) THEN
    CREATE UNIQUE INDEX idx_animales_identificador
      ON public.animales (identificador);
  END IF;
END $$;
