import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  user_id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  landmark: string | null;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,name,phone,address,landmark")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function upsertProfile(input: Profile): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(input, { onConflict: "user_id" });
  if (error) throw error;
}
