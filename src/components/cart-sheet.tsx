import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, LogIn, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { kitchen } from "@/lib/kitchen-config";
import { whatsappUrl } from "@/lib/menu";
import { WhatsAppIcon } from "@/components/site-header";
import { fetchProfile, upsertProfile } from "@/lib/profile";

const contactSchema = z.object({
  customer_name: z.string().trim().min(1, "Name required").max(100),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Digits only"),
  address: z.string().trim().min(3, "Address required").max(500),
  landmark: z.string().trim().max(200).optional(),
  date: z.string().trim().min(1, "Pick a date"),
  slot: z.string().trim().min(1, "Pick a slot").max(50),
  notes: z.string().trim().max(500).optional(),
});

const SLOTS: { value: string; label: string; meal: "Lunch" | "Snack" | "Dinner" }[] = [
  { value: "12:30-13:30", label: "Lunch · 12:30 – 1:30 pm", meal: "Lunch" },
  { value: "13:30-14:30", label: "Lunch · 1:30 – 2:30 pm", meal: "Lunch" },
  { value: "16:30-17:30", label: "Snack · 4:30 – 5:30 pm", meal: "Snack" },
  { value: "19:30-20:30", label: "Dinner · 7:30 – 8:30 pm", meal: "Dinner" },
  { value: "20:30-21:30", label: "Dinner · 8:30 – 9:30 pm", meal: "Dinner" },
];

function generateCode() {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const prefix = kitchen.brand.name.slice(0, 2).toUpperCase();
  let out = `${prefix}-`;
  for (let i = 0; i < 5; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

function todayIso() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  customer_name: "",
  phone: "",
  address: "",
  landmark: "",
  date: todayIso(),
  slot: "",
  notes: "",
};

export function CartSheet() {
  const { items, count, subtotal, setQty, remove, clear, isOpen, closeCart } = useCart();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.href });

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<null | "whatsapp" | "checkout">(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // auto-fill from saved profile on sign-in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingProfile(true);
    fetchProfile(user.id)
      .then((p) => {
        if (cancelled || !p) return;
        setForm((f) => ({
          ...f,
          customer_name: f.customer_name || p.name || "",
          phone: f.phone || p.phone || "",
          address: f.address || p.address || "",
          landmark: f.landmark || p.landmark || "",
        }));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingProfile(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const slotLabel = useMemo(
    () => SLOTS.find((s) => s.value === form.slot)?.label ?? form.slot,
    [form.slot],
  );

  if (!isOpen) return null;

  function goSignIn() {
    closeCart();
    localStorage.setItem("pendingOrder", JSON.stringify({ action: "open-cart" }));
    navigate({ to: "/auth", search: { next: currentPath || "/" } });
  }

  async function submit(mode: "whatsapp" | "checkout", e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!user) {
      goSignIn();
      return;
    }
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(mode);
    const code = generateCode();
    const slotStamp = `${parsed.data.date} · ${slotLabel}`;
    const fullAddress = parsed.data.landmark
      ? `${parsed.data.address} · ${parsed.data.landmark}`
      : parsed.data.address;
    const rows = items.map((i) => ({
      code,
      dish_key: i.key,
      dish_name: i.name,
      price: i.price,
      quantity: i.quantity,
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: fullAddress,
      slot: slotStamp,
      notes: parsed.data.notes || null,
      user_id: user.id,
    }));
    const { error } = await supabase.from("orders").insert(rows);
    if (error) {
      setSubmitting(null);
      toast.error("Could not save order. Please try again.");
      return;
    }
    // save profile for next time (best-effort)
    upsertProfile({
      user_id: user.id,
      name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      landmark: parsed.data.landmark || null,
    }).catch(() => {});

    setSubmitting(null);
    toast.success(`Order saved · ${code}`);

    if (mode === "whatsapp") {
      const lines = [
        `Order ${code}`,
        ...items.map(
          (i) => `${i.quantity} × ${i.name} — ${kitchen.currencySymbol}${i.price * i.quantity}`,
        ),
        `Total: ${kitchen.currencySymbol}${subtotal}`,
        `Name: ${parsed.data.customer_name}`,
        `Phone: ${parsed.data.phone}`,
        `Address: ${fullAddress}`,
        `When: ${slotStamp}`,
        parsed.data.notes ? `Notes: ${parsed.data.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      window.open(whatsappUrl(lines), "_blank", "noopener,noreferrer");
    } else {
      toast.success("We'll call to confirm. Pay on delivery.", { duration: 5000 });
    }
    clear();
    setForm(EMPTY_FORM);
    closeCart();
  }

  const needsSignIn = ready && !user;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/60" onClick={closeCart}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-clay" />
            <h2 className="font-serif text-xl text-ink">Your order</h2>
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <button
              type="button"
              onClick={closeCart}
              className="mt-2 rounded-full border border-ink/15 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ink hover:border-ink/40"
            >
              Browse the menu
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => submit("whatsapp", e)}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-border px-5">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-3 py-4">
                    <img
                      src={i.image}
                      alt={i.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            {i.meal} · {kitchen.currencySymbol}
                            {i.price}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(i.key)}
                          aria-label={`Remove ${i.name}`}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-clay"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-ink/15">
                          <button
                            type="button"
                            onClick={() => setQty(i.key, i.quantity - 1)}
                            aria-label="Decrease"
                            className="px-2 py-1 text-ink hover:text-clay"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[24px] text-center text-sm tabular-nums text-ink">
                            {i.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(i.key, i.quantity + 1)}
                            aria-label="Increase"
                            className="px-2 py-1 text-ink hover:text-clay"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-serif text-base text-ink">
                          {kitchen.currencySymbol}
                          {i.price * i.quantity}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {needsSignIn ? (
                <div className="border-t border-border bg-cream/40 px-5 py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cream">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-ink">Sign in to place your order</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We'll save your delivery details and order history so next time is one tap.
                  </p>
                  <button
                    type="button"
                    onClick={goSignIn}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
                  >
                    Sign in to continue
                  </button>
                  <p className="mt-3 text-[10px] text-muted-foreground">
                    Your cart is safe — it will still be here when you return.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 border-t border-border bg-cream/40 px-5 py-5">
                  {loadingProfile && (
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Loading your saved details…
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Your name"
                      value={form.customer_name}
                      onChange={(v) => setForm({ ...form, customer_name: v })}
                    />
                    <Field
                      label="Phone"
                      type="tel"
                      placeholder="+91"
                      value={form.phone}
                      onChange={(v) => setForm({ ...form, phone: v })}
                    />
                  </div>
                  <Field
                    label="Delivery address"
                    value={form.address}
                    onChange={(v) => setForm({ ...form, address: v })}
                    placeholder="Sector, flat / house"
                  />
                  <Field
                    label="Hostel / landmark (optional)"
                    required={false}
                    value={form.landmark}
                    onChange={(v) => setForm({ ...form, landmark: v })}
                    placeholder="e.g. NIT Hostel 7, near Ram Mandir"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        Delivery date
                      </label>
                      <input
                        type="date"
                        required
                        min={todayIso()}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        Time slot
                      </label>
                      <select
                        required
                        value={form.slot}
                        onChange={(e) => setForm({ ...form, slot: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-clay"
                      >
                        <option value="">Pick a slot</option>
                        {SLOTS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      Notes (optional)
                    </label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
                      placeholder="Less spicy, extra roti, etc."
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    View past orders in{" "}
                    <Link to="/account" className="underline hover:text-clay">
                      your account
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>

            <footer className="border-t border-border bg-background px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-serif text-2xl text-ink">
                  {kitchen.currencySymbol}
                  {subtotal}
                </span>
              </div>
              {needsSignIn ? (
                <button
                  type="button"
                  onClick={goSignIn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in to checkout
                </button>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={!!submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-60"
                  >
                    {submitting === "whatsapp" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                    )}
                    Order on WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={(e) => submit("checkout", e)}
                    disabled={!!submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
                  >
                    {submitting === "checkout" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Place order · Pay on delivery
                  </button>
                </div>
              )}
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                We'll call to confirm. COD or UPI on delivery.
              </p>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
      />
    </div>
  );
}
