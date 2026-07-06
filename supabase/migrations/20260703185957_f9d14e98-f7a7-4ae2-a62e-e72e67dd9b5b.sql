-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Menu items
CREATE TYPE public.meal_type AS ENUM ('Lunch', 'Snack', 'Dinner');

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  meal public.meal_type NOT NULL,
  veg BOOLEAN NOT NULL DEFAULT true,
  signature BOOLEAN NOT NULL DEFAULT false,
  sold_out BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active menu items" ON public.menu_items
  FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert menu items" ON public.menu_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update menu items" ON public.menu_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete menu items" ON public.menu_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  dish_key TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  slot TEXT,
  notes TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Cook applications
CREATE TYPE public.application_status AS ENUM ('new', 'reviewing', 'accepted', 'declined');

CREATE TABLE public.cook_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT NOT NULL,
  dishes TEXT NOT NULL,
  experience TEXT,
  status public.application_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.cook_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cook_applications TO authenticated;
GRANT ALL ON public.cook_applications TO service_role;
ALTER TABLE public.cook_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply" ON public.cook_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view applications" ON public.cook_applications
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.cook_applications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete applications" ON public.cook_applications
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER cook_applications_updated_at BEFORE UPDATE ON public.cook_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed menu
INSERT INTO public.menu_items (key, name, description, price, meal, veg, signature, sold_out, sort_order) VALUES
('dalma', 'Odia Dalma', 'Toor dal slow-cooked with pumpkin, raw banana and a tempering of panch phutana.', 120, 'Lunch', true, true, false, 10),
('santula', 'Santula', 'Light mixed-vegetable stew, ginger-forward, the way grandma made on quiet afternoons.', 90, 'Lunch', true, false, false, 20),
('macha-besara', 'Macha Besara', 'Rohu fish in a mustard-poppy gravy. Sharp, warm, unmistakably Odia.', 220, 'Lunch', false, false, false, 30),
('aloo-poori', 'Aloo Poori', 'Six hand-rolled pooris with cumin-tempered aloo curry.', 110, 'Lunch', true, false, false, 40),
('chicken-jhola', 'Home-style Chicken Jhola', 'Country chicken, mustard oil, whole spices. Thin, glossy, meant for rice.', 260, 'Dinner', false, true, false, 50),
('chhena-poda', 'Chhena Poda', 'Slow-baked cottage cheese, caramelised edges. One slice, wrapped in banana leaf.', 80, 'Snack', true, false, false, 60),
('pakhala', 'Pakhala Thali', 'Fermented rice, badi chura, aloo bharta, fried machha. Odisha''s summer ritual.', 160, 'Lunch', false, false, false, 70),
('gupchup', 'Gupchup Box', 'Eight crisp puris, ragda, tamarind-jeera water on the side. Assemble at home.', 70, 'Snack', true, false, false, 80),
('mudhi-mansa', 'Mudhi Mansa', 'Puffed rice with slow-cooked mutton curry. A Baripada evening in one bowl.', 280, 'Dinner', false, false, false, 90),
('kheeri', 'Rice Kheeri', 'Gobindobhog rice, cardamom, jaggery. Small clay pot. Enough for two.', 90, 'Dinner', true, false, true, 100);