
-- Update the trigger function to copy name/phone/address/landmark from raw_user_meta_data
CREATE OR REPLACE FUNCTION private.auto_create_profile_and_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;

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

  RETURN NEW;
END;
$$;
