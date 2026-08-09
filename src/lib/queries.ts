import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { imageForKey } from "./menu-images";
import type { Dish } from "./menu";
import { computeAnalytics, type Analytics } from "./analytics";

export const menuQueryOptions = queryOptions({
  queryKey: ["menu-items", "active"],
  queryFn: async (): Promise<Dish[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,key,name,description,price,meal,veg,signature,sold_out,sort_order,image_url")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      const { data: d2, error: e2 } = await supabase
        .from("menu_items")
        .select("id,key,name,description,price,meal,veg,signature,sold_out,sort_order,image_url")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (e2) throw e2;
      return (d2 ?? []).map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        desc: r.description,
        price: r.price,
        meal: r.meal as Dish["meal"],
        veg: r.veg,
        signature: r.signature,
        soldOut: r.sold_out,
        image: imageForKey(r.key, r.image_url),
      }));
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      desc: r.description,
      price: r.price,
      meal: r.meal as Dish["meal"],
      veg: r.veg,
      signature: r.signature,
      soldOut: r.sold_out,
      image: imageForKey(r.key, r.image_url),
    }));
  },
  staleTime: 60_000,
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

export const weeklyMenuQueryOptions = queryOptions({
  queryKey: ["weekly_menu"],
  queryFn: async (): Promise<WeeklyMenuRow[]> => {
    const { data, error } = await supabase
      .from("weekly_menu")
      .select("id,day,meal,dishes,featured_dish,image_url")
      .order("day", { ascending: true })
      .order("meal", { ascending: true });
    if (error) throw error;
    return (data ?? []) as WeeklyMenuRow[];
  },
  staleTime: 60_000,
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
