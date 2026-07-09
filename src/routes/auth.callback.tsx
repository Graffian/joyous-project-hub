import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [{ title: `Confirming sign-in · ${kitchen.brand.fullName}` }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { user } = data.session;
        const meta = user.user_metadata || {};

        // Check if address/landmark are missing (Google signup)
        const needsAddress = !meta.address && !meta.landmark;

        if (needsAddress) {
          window.location.href = "/account/complete";
        } else {
          window.location.href = "/";
        }
      } else {
        window.location.href = "/auth";
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-clay" />
        <p className="mt-3 text-sm text-muted-foreground">Confirming your sign-in...</p>
      </div>
    </div>
  );
}
