import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Loader2 } from "lucide-react";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const tabs = [
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/weekly", label: "Weekly" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/applications", label: "Cooks" },
] as const;

function AdminLayout() {
  const [status, setStatus] = useState<"checking" | "admin" | "denied">("checking");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getUser();
      if (!sess.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setStatus(data ? "admin" : "denied");
    })();
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === "/admin") navigate({ to: "/admin/menu", replace: true });
  }, [location.pathname, navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-background px-6 py-24 text-center">
        <h1 className="font-serif text-3xl text-ink">Not an admin</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is signed in but doesn't have admin access yet. Ask an existing admin to grant it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="rounded-full border border-ink/15 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-ink"
          >
            Home
          </Link>
          <button
            onClick={signOut}
            className="rounded-full bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-cream"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-cream/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-xl italic text-ink">{kitchen.brand.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Admin
            </span>
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-6 px-5 md:px-8">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="border-b-2 border-transparent pb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground data-[status=active]:border-clay data-[status=active]:text-ink"
              activeProps={{ "data-status": "active" } as any}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
