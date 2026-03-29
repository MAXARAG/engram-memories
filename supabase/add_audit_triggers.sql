-- ══════════════════════════════════════════════════════════════════════════════
-- Audit triggers — registra INSERT / UPDATE / DELETE en audit_logs
-- con actor_uid y actor_email del usuario autenticado (auth.uid())
-- Ejecutar DESPUÉS de add_profiles_and_audit.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Trigger function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid   uuid;
  v_email text;
  v_action text;
  v_desc  text;
BEGIN
  v_uid   := auth.uid();
  v_action := lower(TG_OP); -- 'insert' | 'update' | 'delete'

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_uid;

  -- Human-friendly description
  v_desc := CASE v_action
    WHEN 'insert' THEN 'Registró en ' || TG_TABLE_NAME
    WHEN 'update' THEN 'Modificó en ' || TG_TABLE_NAME
    WHEN 'delete' THEN 'Eliminó en ' || TG_TABLE_NAME
    ELSE v_action || ' en ' || TG_TABLE_NAME
  END;

  INSERT INTO public.audit_logs (actor_uid, actor_email, action, target_email, description, created_at)
  VALUES (v_uid, v_email, v_action, TG_TABLE_NAME, v_desc, now());

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ─── Attach triggers to every table ──────────────────────────────────────────

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'animales','alimentacion','sanidad','reproduccion',
    'destete','faena','movimientos','costos','stock_alimento'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS audit_%I ON %I;
      CREATE TRIGGER audit_%I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ─── RLS for audit_logs ───────────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (dashboard shows activity)
CREATE POLICY "audit_read_authenticated"
  ON audit_logs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Inserts come from the trigger (SECURITY DEFINER) and service role
CREATE POLICY "audit_insert_service"
  ON audit_logs FOR INSERT TO service_role
  WITH CHECK (true);
