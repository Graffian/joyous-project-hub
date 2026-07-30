import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [{ title: `Reset password · ${kitchen.brand.fullName}` }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) {
      toast.error("Invalid reset link. Please request a new password reset.");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
      return;
    }

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1500);
        return;
      }

      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          toast.error("Failed to initialize reset session. Please try again.");
          setTimeout(() => {
            window.location.href = "/auth";
          }, 1500);
          return;
        }
        setSessionReady(true);
      });
    });
  }, []);

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      if (
        error.message.toLowerCase().includes("session") ||
        error.message.toLowerCase().includes("auth") ||
        error.message.toLowerCase().includes("not authenticated") ||
        error.message.toLowerCase().includes("invalid")
      ) {
        window.location.href = "/auth";
      }
      return;
    }
    toast.success("Password updated successfully.");
    navigate({ to: "/" });
  }

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-clay" />
          <p className="mt-3 text-sm text-muted-foreground">Loading reset form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 md:px-8">
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-clay"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <h1 className="mt-6 font-serif text-3xl leading-[1.05] text-ink">
          Set a new <span className="italic text-clay">password</span>
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleReset} className="mt-6 grid gap-3">
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Update password
          </button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Passwords must be at least 6 characters.
        </p>
      </div>
    </div>
  );
}
