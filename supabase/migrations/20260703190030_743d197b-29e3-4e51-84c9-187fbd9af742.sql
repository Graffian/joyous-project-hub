-- Lock down has_role: RLS policies use it via the owner's privileges, so callers don't need EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Tighten public-insert policies with basic input constraints
DROP POLICY "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(customer_name)) BETWEEN 1 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(address)) BETWEEN 3 AND 500
    AND length(trim(dish_name)) BETWEEN 1 AND 200
    AND quantity BETWEEN 1 AND 20
    AND price >= 0
    AND price <= 100000
  );

DROP POLICY "Anyone can apply" ON public.cook_applications;
CREATE POLICY "Anyone can apply" ON public.cook_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 100
    AND length(trim(phone)) BETWEEN 6 AND 20
    AND length(trim(area)) BETWEEN 1 AND 200
    AND length(trim(dishes)) BETWEEN 1 AND 1000
    AND (experience IS NULL OR length(experience) <= 2000)
  );