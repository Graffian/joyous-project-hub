
-- Profiles are only created after email/phone confirmation, not at signup time.
-- INSERT trigger: creates user_roles + profiles only if already confirmed (OAuth etc.)
-- UPDATE trigger: creates profiles when email_confirmed_at / phone_confirmed_at is set

-- ── Replace the INSERT trigger function ──────────────────────────────────────
CREATE OR REPLACE FUNCTION private.auto_create_profile_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

  -- Only create profile for already-confirmed users (OAuth, phone OTP, no-confirmation mode)
  IF NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, name, phone, address, landmark)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      NULLIF(NEW.raw_user_meta_data->>'address', ''),
      NULLIF(NEW.raw_user_meta_data->>'landmark', '')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name    = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
      phone   = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
      address = COALESCE(NULLIF(EXCLUDED.address, ''), profiles.address),
      landmark= COALESCE(NULLIF(EXCLUDED.landmark, ''), profiles.landmark);
  END IF;

  RETURN NEW;
END;
$$;

-- ── New function for post-confirmation profile creation ──────────────────────
CREATE OR REPLACE FUNCTION private.auto_create_profile_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
     OR (OLD.phone_confirmed_at IS NULL AND NEW.phone_confirmed_at IS NOT NULL)
  THEN
    INSERT INTO public.profiles (user_id, name, phone, address, landmark)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      NULLIF(NEW.raw_user_meta_data->>'address', ''),
      NULLIF(NEW.raw_user_meta_data->>'landmark', '')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name    = COALESCE(NULLIF(EXCLUDED.name, ''), profiles.name),
      phone   = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
      address = COALESCE(NULLIF(EXCLUDED.address, ''), profiles.address),
      landmark= COALESCE(NULLIF(EXCLUDED.landmark, ''), profiles.landmark);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.auto_create_profile_on_confirm() FROM PUBLIC;

-- ── Add UPDATE trigger ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_auto_create_profile_on_confirm ON auth.users;
CREATE TRIGGER trg_auto_create_profile_on_confirm
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.auto_create_profile_on_confirm();
