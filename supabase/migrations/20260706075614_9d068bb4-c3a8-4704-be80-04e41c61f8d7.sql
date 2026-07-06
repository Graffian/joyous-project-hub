
-- 1) profiles table for saved delivery details & history lookup
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone text,
  address text,
  landmark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_all" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) tie orders and applications to a signed-in user
ALTER TABLE public.orders
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX orders_user_id_idx ON public.orders(user_id);

ALTER TABLE public.cook_applications
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX cook_applications_user_id_idx ON public.cook_applications(user_id);

-- 3) move SECURITY DEFINER has_role out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 4) drop every policy that references public.has_role so we can drop it,
--    and rebuild them against private.has_role with the new ownership rules

-- cook_applications
DROP POLICY IF EXISTS "Admins can delete applications" ON public.cook_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.cook_applications;
DROP POLICY IF EXISTS "Admins can view applications" ON public.cook_applications;
DROP POLICY IF EXISTS "Anyone can apply" ON public.cook_applications;

CREATE POLICY "cook_apps_admin_select" ON public.cook_applications FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "cook_apps_admin_update" ON public.cook_applications FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "cook_apps_admin_delete" ON public.cook_applications FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "cook_apps_select_own" ON public.cook_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "cook_apps_insert_own" ON public.cook_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(trim(name)) BETWEEN 1 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(area)) BETWEEN 1 AND 200
    AND length(trim(dishes)) BETWEEN 1 AND 1000
    AND (experience IS NULL OR length(experience) <= 2000)
  );

-- orders
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;

CREATE POLICY "orders_admin_select" ON public.orders FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(trim(customer_name)) BETWEEN 1 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(address)) BETWEEN 3 AND 500
    AND length(trim(dish_name)) BETWEEN 1 AND 200
    AND quantity BETWEEN 1 AND 20
    AND price >= 0 AND price <= 100000
  );

-- menu_items: keep public read of active items, split admin path so anon
-- never has to call the SECURITY DEFINER function
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can view active menu items" ON public.menu_items;

CREATE POLICY "menu_public_active" ON public.menu_items FOR SELECT TO anon, authenticated
  USING (active = true);
CREATE POLICY "menu_admin_select" ON public.menu_items FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "menu_admin_insert" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "menu_admin_update" ON public.menu_items FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "menu_admin_delete" ON public.menu_items FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 5) drop the old public.has_role now that no policies reference it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
