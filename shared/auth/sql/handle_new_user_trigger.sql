-- =============================================================================
-- TASK 1: DATABASE CORE SETUP (PL/pgSQL Trigger)
-- Run this script in the Supabase SQL Editor.
-- Syncs new auth.users rows into public.users using signup metadata.
-- =============================================================================

-- Ensure the custom Role enum exists (skip if already created in Supabase).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE public."Role" AS ENUM (
      'admin',
      'employee',
      'kitchen_employee',
      'customer'
    );
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Row-sync function: extracts name + role from raw_user_meta_data
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name  TEXT;
  user_role  TEXT;
  safe_role  public."Role";
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');

  IF user_role IS NULL THEN
    safe_role := 'customer'::public."Role";
  ELSE
    BEGIN
      safe_role := user_role::public."Role";
    EXCEPTION
      WHEN invalid_text_representation THEN
        safe_role := 'customer'::public."Role";
      WHEN OTHERS THEN
        safe_role := 'customer'::public."Role";
    END;
  END IF;

  INSERT INTO public.users (id, name, email, role)
  VALUES (NEW.id, user_name, NEW.email, safe_role)
  ON CONFLICT (id) DO UPDATE
    SET name  = EXCLUDED.name,
        email = EXCLUDED.email,
        role  = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- after insert trigger on auth.users
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute to Supabase auth admin role (required for trigger execution).
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.users TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- ---------------------------------------------------------------------------
-- Row Level Security (required for frontend role lookups after login)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
