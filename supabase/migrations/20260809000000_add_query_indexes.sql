-- Reduce disk I/O: every orders/admin/analytics query was doing a FULL TABLE SCAN
-- because there was no index on created_at (ORDER BY created_at DESC + RLS policy
-- evaluated per row). Add composite indexes to cover the hot query paths.

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_user_created_at_idx
  ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS menu_items_active_sort_idx
  ON public.menu_items (active, sort_order);

CREATE INDEX IF NOT EXISTS cook_applications_created_at_idx
  ON public.cook_applications (created_at DESC);
