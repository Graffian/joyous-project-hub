import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { imageForKey } from "./menu-images";
import type { Dish } from "./menu";
import { computeAnalytics, type Analytics } from "./analytics";

const publicMenu: Dish[] = (
  [
    ["dalma", "Odia Dalma", "Lentils with seasonal vegetables and roasted spices.", 120, "Lunch", true, true],
    ["santula", "Santula", "Lightly spiced seasonal vegetables, cooked Odia-style.", 100, "Lunch", true, false],
    ["macha-besara", "Macha Besara", "Fresh fish in a mustard and tomato gravy.", 180, "Lunch", false, true],
    ["aloo-poori", "Aloo Poori", "Fluffy pooris with warmly spiced potato curry.", 90, "Lunch", true, false],
    ["chicken-jhola", "Chicken Jhola", "Tender chicken in a homestyle aromatic curry.", 200, "Dinner", false, true],
    ["pakhala", "Pakhala Bhata", "Cooling fermented rice with a simple seasonal side.", 90, "Lunch", true, false],
    ["gupchup", "Gupchup", "Crisp puris with tangy tamarind water and potato filling.", 60, "Snack", true, false],
    ["mudhi-mansa", "Mudhi Mansa", "Slow-cooked mutton curry served with puffed rice.", 220, "Dinner", false, true],
    ["chhena-poda", "Chhena Poda", "Caramelized baked cottage-cheese dessert.", 80, "Snack", true, false],
    ["kheeri", "Kheeri", "Creamy rice pudding with cardamom and nuts.", 70, "Snack", true, false],
  ] as const
).map(([key, name, desc, price, meal, veg, signature]) => ({
  id: key,
  key,
  name,
  desc,
  price,
  meal: meal as Dish["meal"],
  veg,
  signature,
  image: imageForKey(key),
}));

export const menuQueryOptions = queryOptions({
  queryKey: ["menu-items", "active"],
  queryFn: (): Promise<Dish[]> => Promise.resolve(publicMenu),
  staleTime: Infinity,
});

export const adminMenuQueryOptions = queryOptions({
  queryKey: ["menu-items", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const adminOrdersQueryOptions = queryOptions({
  queryKey: ["orders", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const adminApplicationsQueryOptions = queryOptions({
  queryKey: ["cook_applications", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("cook_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export type WeeklyMenuRow = {
  id: string;
  day: number;
  meal: "Lunch" | "Dinner";
  dishes: string[];
  featured_dish: string | null;
  image_url: string | null;
};

const publicWeeklyMenu: WeeklyMenuRow[] = (
  [
    [1, "Lunch", ["Odia Dalma", "Steamed rice", "Baingan bhaja"], "Odia Dalma"],
    [1, "Dinner", ["Chicken jhola", "Fresh rotis", "Salad"], "Chicken Jhola"],
    [2, "Lunch", ["Santula", "Steamed rice", "Tomato chutney"], "Santula"],
    [2, "Dinner", ["Macha besara", "Fresh rotis", "Seasonal salad"], "Macha Besara"],
    [3, "Lunch", ["Pakhala bhata", "Aloo bhaja", "Badi chura"], "Pakhala Bhata"],
    [3, "Dinner", ["Paneer curry", "Fresh rotis", "Dal"], "Paneer Curry"],
    [4, "Lunch", ["Mixed vegetable ghanta", "Steamed rice", "Pickle"], "Ghanta Tarkari"],
    [4, "Dinner", ["Chicken jhola", "Fresh rotis", "Salad"], "Chicken Jhola"],
    [5, "Lunch", ["Macha besara", "Steamed rice", "Santula"], "Macha Besara"],
    [5, "Dinner", ["Soybean curry", "Fresh rotis", "Dal"], "Soybean Curry"],
    [6, "Lunch", ["Dalma", "Steamed rice", "Tomato chutney"], "Odia Dalma"],
    [6, "Dinner", ["Mutton curry", "Fresh rotis", "Salad"], "Mudhi Mansa"],
  ] as const
).map(([day, meal, dishes, featured_dish]) => ({
  id: `${day}-${meal.toLowerCase()}`,
  day,
  meal: meal as WeeklyMenuRow["meal"],
  dishes: [...dishes],
  featured_dish,
  image_url: null,
}));

export const weeklyMenuQueryOptions = queryOptions({
  queryKey: ["weekly_menu"],
  queryFn: (): Promise<WeeklyMenuRow[]> => Promise.resolve(publicWeeklyMenu),
  staleTime: Infinity,
});

export const analyticsQueryOptions = queryOptions({
  queryKey: ["analytics"],
  queryFn: async (): Promise<Analytics> => {
    const { data, error } = await supabase
      .from("orders")
      .select("status, price, quantity, created_at, dish_name")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return computeAnalytics(data as never[] ?? []);
  },
  staleTime: 60_000,
});
