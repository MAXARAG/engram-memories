-- ============================================================
-- VaniApp - Migración: Tabla seguimiento_tratamiento
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS seguimiento_tratamiento (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sanidad_id    uuid REFERENCES sanidad(id) ON DELETE CASCADE,
  fecha         date NOT NULL DEFAULT CURRENT_DATE,
  temperatura   numeric,
  peso          numeric,
  estado        text NOT NULL DEFAULT 'en_curso',
  observaciones text,
  created_at    timestamptz DEFAULT now()
);

-- estado: 'en_curso' | 'mejorado' | 'sin_cambios' | 'empeoro' | 'completado'

CREATE INDEX IF NOT EXISTS idx_seguimiento_sanidad ON seguimiento_tratamiento(sanidad_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha   ON seguimiento_tratamiento(fecha DESC);

ALTER TABLE seguimiento_tratamiento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'seguimiento_tratamiento'
    AND policyname = 'Usuarios autenticados gestionan seguimientos'
  ) THEN
    CREATE POLICY "Usuarios autenticados gestionan seguimientos"
      ON seguimiento_tratamiento FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END
$$;
