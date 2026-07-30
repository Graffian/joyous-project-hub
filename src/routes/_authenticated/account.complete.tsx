import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile, upsertProfile } from "@/lib/profile";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { whatsappUrl } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import type { Dish } from "@/lib/menu";

type PendingOrder = {
  dish: {
    key: string;
    name: string;
    price: number;
    meal: string;
    image: string;
  };
  action: "add-to-cart" | "order-now";
};

export const Route = createFileRoute("/_authenticated/account/complete")({
  ssr: false,
  head: () => ({
    meta: [{ title: `Complete your profile · ${kitchen.brand.fullName}` }],
  }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then((p) => {
      if (!p) return;
      if (p.name) setName(p.name);
      if (p.phone) setPhone(p.phone);
      if (p.address) setAddress(p.address);
      if (p.landmark) setLandmark(p.landmark);
    });
    const meta = user.user_metadata;
    if (meta) {
      setName((prev) => prev || meta.name || "");
      setPhone((prev) => prev || meta.phone || "");
    }
  }, [user]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user || saved) return;
    setSaving(true);
    try {
      await upsertProfile({
        user_id: user.id,
        name: name.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        landmark: landmark.trim() || null,
      });

      const raw = localStorage.getItem("pendingOrder");
      localStorage.removeItem("pendingOrder");

      if (raw) {
        let order: PendingOrder;
        try {
          order = JSON.parse(raw);
        } catch {
          setSaved(true);
          setTimeout(() => navigate({ to: "/" }), 1200);
          return;
        }

        if (order.action === "add-to-cart") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cart.add(order.dish as any);
          cart.openCart();
          setSaved(true);
          setTimeout(() => navigate({ to: "/" }), 1200);
          return;
        }

        if (order.action === "order-now") {
          const lines = [
            `Order from ${kitchen.brand.name}`,
            `1 × ${order.dish.name} — ${kitchen.currencySymbol}${order.dish.price}`,
            `Name: ${name.trim()}`,
            `Phone: ${phone.trim()}`,
            `Address: ${address.trim()}${landmark.trim() ? ` · ${landmark.trim()}` : ""}`,
          ]
            .filter(Boolean)
            .join("\n");
          window.open(whatsappUrl(lines), "_blank", "noopener,noreferrer");
          setSaved(true);
          setTimeout(() => navigate({ to: "/" }), 1200);
          return;
        }
      }

      setSaved(true);
      setTimeout(() => navigate({ to: "/" }), 1200);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16 md:px-8">
        <Link
          to="/"
          className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground hover:text-clay"
        >
          ← Back home
        </Link>

        {saved ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 stroke-[2.5] text-green-600" />
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-ink">
              All set
              <span className="italic text-clay">!</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your details have been saved. Taking you home...
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-ink">
              Almost done —
              <br />
              <span className="italic text-clay">just a few details.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We need your delivery address to get your food to you.
            </p>

            <form onSubmit={save} className="mt-8 grid gap-4">
              <Field label="Your name" value={name} onChange={setName} disabled={saving} />
              <Field
                label="Phone number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+91"
                disabled={saving}
              />
              <Field
                label="Delivery address"
                value={address}
                onChange={setAddress}
                placeholder="Sector, flat / house"
                disabled={saving}
              />
              <Field
                label="Landmark (optional)"
                value={landmark}
                onChange={setLandmark}
                placeholder="e.g. NIT Hostel 7"
                required={false}
                disabled={saving}
              />
              <button
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save & continue
              </button>
            </form>
          </>
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none focus:border-clay disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
