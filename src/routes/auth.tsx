import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { kitchen } from "@/lib/kitchen-config";

type AuthSearch = { next?: string };

function isSafePath(p: unknown): p is string {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//");
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    next: isSafePath(s.next) ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Sign in · ${kitchen.brand.fullName}` },
      { name: "description", content: `Sign in to order from ${kitchen.brand.fullName}.` },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = next ?? "/account";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: dest });
    });
  }, [navigate, dest]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + dest },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: dest });
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth" + (next ? `?next=${encodeURIComponent(next)}` : ""),
    });
    if (result.error) {
      setBusy(false);
      toast.error(result.error.message ?? "Sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: dest });
  }

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 md:px-8">
        <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground hover:text-clay">
          ← Back home
        </Link>
        <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-ink">
          {mode === "signin" ? (
            <>
              Sign in to <span className="italic text-clay">{kitchen.brand.name}</span>.
            </>
          ) : (
            <>
              Create an <span className="italic text-clay">account</span>.
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {next
            ? "One quick step so we can save your delivery details and order history."
            : "Sign in to place orders, track your history, or manage the kitchen."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-8 inline-flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-background px-5 py-3 text-sm font-medium text-ink transition-all hover:bg-ink/[0.03] disabled:opacity-60"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.18 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z" />
    </svg>
  );
}
