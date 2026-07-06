import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogIn, X } from "lucide-react";
import { z } from "zod";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { whatsappUrl, type Dish } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile } from "@/lib/profile";

const orderSchema = z.object({
  customer_name: z.string().trim().min(1, "Name required").max(100),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Digits only"),
  address: z.string().trim().min(3, "Address required").max(500),
  slot: z.string().trim().max(50).optional(),
  quantity: z.number().int().min(1).max(20),
  notes: z.string().trim().max(500).optional(),
});

function generateCode() {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const prefix = kitchen.brand.name.slice(0, 2).toUpperCase();
  let out = `${prefix}-`;
  for (let i = 0; i < 5; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

export function OrderDialog({
  dish,
  open,
  onOpenChange,
}: {
  dish: Dish | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname + s.location.search });

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    slot: "",
    quantity: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    let cancelled = false;
    fetchProfile(user.id)
      .then((p) => {
        if (cancelled || !p) return;
        setForm((f) => ({
          ...f,
          customer_name: f.customer_name || p.name || "",
          phone: f.phone || p.phone || "",
          address: f.address || p.address || "",
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, open]);

  if (!open || !dish) return null;

  function goSignIn() {
    onOpenChange(false);
    navigate({ to: "/auth", search: { next: currentPath || "/" } });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dish) return;
    if (!user) {
      goSignIn();
      return;
    }
    const parsed = orderSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    const code = generateCode();
    const { error } = await supabase.from("orders").insert({
      code,
      dish_key: dish.key,
      dish_name: dish.name,
      price: dish.price,
      quantity: parsed.data.quantity,
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      slot: parsed.data.slot || null,
      notes: parsed.data.notes || null,
      user_id: user.id,
    });
    if (error) {
      setSubmitting(false);
      toast.error("Could not save order. Please try again.");
      return;
    }
    upsertProfile({
      user_id: user.id,
      name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      landmark: null,
    }).catch(() => {});
    setSubmitting(false);
    const total = dish.price * parsed.data.quantity;
    const msg = [
      `Order ${code}`,
      `${parsed.data.quantity} × ${dish.name} — ${kitchen.currencySymbol}${total}`,
      `Name: ${parsed.data.customer_name}`,
      `Phone: ${parsed.data.phone}`,
      `Address: ${parsed.data.address}`,
      parsed.data.slot ? `Slot: ${parsed.data.slot}` : "",
      parsed.data.notes ? `Notes: ${parsed.data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    toast.success(`Order saved · ${code}`);
    window.open(whatsappUrl(msg), "_blank", "noopener,noreferrer");
    onOpenChange(false);
    setForm({ customer_name: "", phone: "", address: "", slot: "", quantity: 1, notes: "" });
  }

  const total = dish.price * form.quantity;
  const needsSignIn = ready && !user;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:rounded-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="border-b border-border px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-clay">Order</p>
          <h2 className="mt-1 font-serif text-2xl text-ink">{dish.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {kitchen.currencySymbol}{dish.price} · {dish.meal}
          </p>
        </div>

        {needsSignIn ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cream">
              <LogIn className="h-4 w-4" />
            </div>
            <h3 className="mt-4 font-serif text-xl text-ink">Sign in to order</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll save your delivery details for next time — no need to type them again.
            </p>
            <button
              type="button"
              onClick={goSignIn}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
            >
              Sign in to continue
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Your name"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                type="tel"
                placeholder="+91"
              />
            </div>
            <Field
              label="Delivery address"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="Sector, landmark, flat / house"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })
                  }
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
                />
              </div>
              <Field
                label="Slot (optional)"
                value={form.slot}
                onChange={(v) => setForm({ ...form, slot: v })}
                placeholder="e.g. 1:00 pm"
                required={false}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Notes (optional)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                maxLength={500}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
              />
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Total
                </div>
                <div className="font-serif text-2xl text-ink">{kitchen.currencySymbol}{total}</div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm & open WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>
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
