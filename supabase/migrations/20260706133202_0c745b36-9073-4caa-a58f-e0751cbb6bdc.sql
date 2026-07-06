
ALTER TABLE public.weekly_menu
  ADD COLUMN IF NOT EXISTS featured_dish text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Seed a few examples so the new UI has something to render
UPDATE public.weekly_menu SET featured_dish = 'Aloo Baingan Masala' WHERE day = 1 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Soybean Curry'       WHERE day = 1 AND meal = 'Dinner' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Dalma + Santula'     WHERE day = 2 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Paneer Bhurji'       WHERE day = 2 AND meal = 'Dinner' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Mushroom Curry'      WHERE day = 3 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Dal & Aloo Bhaja'    WHERE day = 3 AND meal = 'Dinner' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Odisha Thali Special'WHERE day = 4 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Ghanta Tarkari'      WHERE day = 4 AND meal = 'Dinner' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Bhindi Curry'        WHERE day = 5 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Bhindi Bhurji'       WHERE day = 5 AND meal = 'Dinner' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Mix Veg Curry'       WHERE day = 6 AND meal = 'Lunch' AND featured_dish IS NULL;
UPDATE public.weekly_menu SET featured_dish = 'Kadhi Pakora'        WHERE day = 6 AND meal = 'Dinner' AND featured_dish IS NULL;
