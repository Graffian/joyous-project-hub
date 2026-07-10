import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Loader2, LogIn } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile } from "@/lib/profile";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/kitchens/apply")({
  head: () => ({
    meta: [
      { title: `Cook with ${kitchen.brand.fullName} — Apply as a home kitchen` },
      {
        name: "description",
        content: `Homemakers in ${kitchen.brand.location}: cook from home, list a few dishes, earn. Join the waitlist.`,
      },
      { property: "og:title", content: `Cook with ${kitchen.brand.fullName}` },
      {
        property: "og:description",
        content: `Turn your home kitchen into an income. Join the ${kitchen.brand.location} waitlist.`,
      },
    ],
  }),
  component: ApplyPage,
});

const applicationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20).regex(/^[0-9+\-\s()]+$/, "Digits only"),
  area: z.string().trim().min(1).max(200),
  dishes: z.string().trim().min(1).max(1000),
  experience: z.string().trim().max(2000).optional(),
});

function ApplyPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = (routerState.location.pathname || "") + (routerState.location.search || "");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
    dishes: "",
    experience: "",
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchProfile(user.id)
      .then((p) => {
        if (cancelled || !p) return;
        setForm((f) => ({
          ...f,
          name: f.name || p.name || "",
          phone: f.phone || p.phone || "",
          area: f.area || p.address || "",
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  function goSignIn() {
    navigate({ to: "/auth", search: { next: currentPath || "/kitchens/apply" } });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      goSignIn();
      return;
    }
    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("cook_applications").insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      area: parsed.data.area,
      dishes: parsed.data.dishes,
      experience: parsed.data.experience || null,
      user_id: user.id,
    });
    if (error) {
      setSubmitting(false);
      toast.error("Could not send application. Please try again.");
      return;
    }
    upsertProfile({
      user_id: user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.area,
      landmark: null,
    }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
  }


  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <SiteHeader />

      <section className="border-b border-border/70">
        <div className="mx-auto max-w-4xl px-5 pb-10 pt-8 md:px-8 md:pb-16 md:pt-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
          >
            <ArrowLeft className="h-3 w-3" /> Back home
          </Link>
          <p className="mt-8 text-xs uppercase tracking-[0.22em] text-clay">
            Cook with us · {kitchen.brand.location} waitlist
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] text-ink md:text-6xl">
            Join as
            <span className="italic text-clay"> a cook.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            If you cook at home and people ask you for seconds — you already have what it takes. We
            handle the orders, the delivery and the payments. You cook a few chosen dishes,
            your way, in your own kitchen.
          </p>
        </div>
      </section>

      <section className="border-b border-border/70 bg-cream/60">
        <div className="mx-auto grid max-w-4xl gap-8 px-5 py-14 md:grid-cols-3 md:px-8">
          {[
            {
              t: "Cook what you know",
              b: "List 4–6 dishes you already make well. No forced menus, no set targets.",
            },
            {
              t: "We bring the orders",
              b: "WhatsApp orders, curated customers in your neighbourhood, delivery managed.",
            },
            {
              t: "Get paid weekly",
              b: "Transparent per-plate earning, paid to your UPI or bank every Sunday.",
            },
          ].map((c) => (
            <div key={c.t} className="border-t border-border pt-5">
              <h3 className="font-serif text-xl text-ink">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-2xl px-5 md:px-8">
          {submitted ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-ink">You're on the list.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks for applying — we've saved your details. We'll reach out on WhatsApp within a
                day to set up a short kitchen visit.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-full border border-ink/20 px-5 py-2.5 text-sm text-ink hover:bg-ink/5"
              >
                Back to today's menu
              </Link>
            </div>
          ) : ready && !user ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-ink">Sign in to apply</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Applications need a verified account so we can reach you. Takes under a minute.
              </p>
              <button
                onClick={goSignIn}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream hover:bg-clay"
              >
                Sign in to continue
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <h2 className="font-serif text-2xl text-ink md:text-3xl">Join the waitlist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Takes a minute. We reply on WhatsApp within a day.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  required
                />
                <Field
                  label="WhatsApp number"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="+91"
                  required
                  type="tel"
                />
                <Field
                  label={`Area in ${kitchen.brand.location}`}
                  value={form.area}
                  onChange={(v) => setForm({ ...form, area: v })}
                  placeholder="e.g. Sector 5, Chhend"
                  required
                />
                <Field
                  label="Dishes you cook well"
                  value={form.dishes}
                  onChange={(v) => setForm({ ...form, dishes: v })}
                  placeholder="e.g. Dalma, Macha Besara, Pitha"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground">
                  A little about you
                </label>
                <textarea
                  rows={4}
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  placeholder="Who do you cook for today? Anything we should know?"
                  className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-clay"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream transition-transform hover:-translate-y-0.5 disabled:opacity-60 md:w-auto"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Send application
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                By applying you agree to a short kitchen visit for hygiene and taste check.
              </p>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-clay"
      />
    </div>
  );
}
