
CREATE TABLE public.weekly_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day smallint NOT NULL CHECK (day BETWEEN 1 AND 6),
  meal text NOT NULL CHECK (meal IN ('Lunch','Dinner')),
  dishes text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day, meal)
);

GRANT SELECT ON public.weekly_menu TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.weekly_menu TO authenticated;
GRANT ALL ON public.weekly_menu TO service_role;

ALTER TABLE public.weekly_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly menu" ON public.weekly_menu
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert weekly menu" ON public.weekly_menu
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update weekly menu" ON public.weekly_menu
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete weekly menu" ON public.weekly_menu
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER weekly_menu_set_updated_at
  BEFORE UPDATE ON public.weekly_menu
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed a default week (Mon-Sat, Lunch + Dinner)
INSERT INTO public.weekly_menu (day, meal, dishes) VALUES
  (1, 'Lunch',  ARRAY['Rice & Roti','Dal Tadka','Aloo Bhaja','Seasonal Sabzi','Salad & Pickle']),
  (1, 'Dinner', ARRAY['Roti','Mixed Veg Curry','Dal','Salad & Pickle']),
  (2, 'Lunch',  ARRAY['Rice & Roti','Dalma','Bhindi Fry','Kobi Tarkari','Salad & Pickle']),
  (2, 'Dinner', ARRAY['Roti','Paneer Bhurji','Dal','Salad & Pickle']),
  (3, 'Lunch',  ARRAY['Rice & Roti','Moong Dal','Santula','Aloo Baigan','Salad & Pickle']),
  (3, 'Dinner', ARRAY['Roti','Chana Masala','Dal','Salad & Pickle']),
  (4, 'Lunch',  ARRAY['Rice & Roti','Dal Fry','Ghanta Tarkari','Kaddu Sabzi','Salad & Pickle']),
  (4, 'Dinner', ARRAY['Roti','Aloo Gobi','Dal','Salad & Pickle']),
  (5, 'Lunch',  ARRAY['Rice & Roti','Dalma','Baigan Bharta','Bhindi','Salad & Pickle']),
  (5, 'Dinner', ARRAY['Roti','Rajma','Dal','Salad & Pickle']),
  (6, 'Lunch',  ARRAY['Rice & Roti','Dal','Kheeri (Sweet)','Seasonal Sabzi','Salad & Pickle']),
  (6, 'Dinner', ARRAY['Roti','Mix Veg','Dal','Salad & Pickle']);
