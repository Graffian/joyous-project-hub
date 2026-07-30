
INSERT INTO public.menu_items (key, name, description, price, meal, veg, signature, sort_order) VALUES
('dalma', 'Odia Dalma', 'Toor dal simmered slow with raw papaya, pumpkin, brinjal and a smoky panch-phutana tempering. Served with steamed rice.', 120, 'Lunch', true, true, 1),
('santula', 'Santula', 'A gentle mixed-vegetable stew — ridge gourd, potato, brinjal — finished with a whisper of mustard oil and ginger.', 90, 'Lunch', true, false, 2),
('aloo-poori', 'Aloo Poori', 'Fluffy hand-rolled pooris with slow-cooked spiced aloo curry. A Sunday-morning classic.', 80, 'Snack', true, false, 3),
('pakhala', 'Pakhala Bhata', 'Fermented rice in cool curd water, served with badi chura, saga bhaja and roasted aloo. Summer on a plate.', 100, 'Lunch', true, true, 4),
('khechedi', 'Khechedi', 'Rice and moong dal cooked with ghee, cumin and a hint of jaggery — the comfort bowl.', 85, 'Dinner', true, false, 5),
('dahi-baigana', 'Dahi Baigana', 'Fried brinjal folded into whisked curd with mustard and curry leaf tempering.', 95, 'Dinner', true, false, 6),
('ghanta-tarkari', 'Ghanta Tarkari', 'A festival-style medley of seven vegetables, chickpeas and coconut in a fragrant Odia masala.', 110, 'Dinner', true, false, 7),
('gupchup', 'Gupchup', 'Crisp puris, spiced potato-chickpea filling, tangy tamarind pani. Odisha''s answer to pani puri.', 60, 'Snack', true, false, 8),
('chhena-poda', 'Chhena Poda', 'Slow-baked cottage-cheese cake, caramelised on the outside, soft within. Odisha''s own dessert.', 70, 'Snack', true, true, 9),
('kheeri', 'Kheeri', 'Rice pudding simmered low with milk, cardamom, cashew and raisins. Ends the meal like a lullaby.', 65, 'Dinner', true, false, 10)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  meal = EXCLUDED.meal,
  veg = EXCLUDED.veg,
  signature = EXCLUDED.signature,
  sort_order = EXCLUDED.sort_order;
