import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

let sessionPromise: Promise<Session | null> | null = null;

async function loadSession(): Promise<Session | null> {
  if (!sessionPromise) {
    sessionPromise = supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (error || !data.user) {
          await supabase.auth.signOut();
          return null;
        }
        const { data: s } = await supabase.auth.getSession();
        return s.session;
      })
      .finally(() => {
        sessionPromise = null;
      });
  }
  return sessionPromise;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? (null as User | null), ready };
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    staleTime: 30_000,
  });
}
