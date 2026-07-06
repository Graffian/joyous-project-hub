import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { imageForKey } from "./menu-images";
import type { Dish } from "./menu";

export const menuQueryOptions = queryOptions({
  queryKey: ["menu-items", "active"],
  queryFn: async (): Promise<Dish[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,key,name,description,price,meal,veg,signature,sold_out,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
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
      image: imageForKey(r.key),
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
