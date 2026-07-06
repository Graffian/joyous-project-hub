import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { fetchProfile, upsertProfile, type Profile } from "@/lib/profile";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: `Your account · ${kitchen.brand.fullName}` },
      { name: "description", content: "Your saved delivery details and past orders." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => fetchProfile(user!.id),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,code,dish_name,quantity,price,status,slot,address,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState<Profile>({
    user_id: user?.id ?? "",
    name: "",
    phone: "",
    address: "",
    landmark: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileQuery.data) setForm({ ...profileQuery.data });
    else if (user) setForm((f) => ({ ...f, user_id: user.id }));
  }, [profileQuery.data, user]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile({
        user_id: user.id,
        name: form.name?.trim() || null,
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        landmark: form.landmark?.trim() || null,
      });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Details saved");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-10 md:px-8 md:py-14">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-clay">Your account</p>
            <h1 className="mt-2 font-serif text-4xl text-ink md:text-5xl">
              {form.name || user?.email || "Welcome"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded-full border border-ink/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-ink hover:border-ink/40"
              >
                Admin
              </Link>
            )}
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-10 px-5 py-12 md:grid-cols-5 md:px-8">
        <form
          onSubmit={save}
          className="md:col-span-2 rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-clay" />
            <h2 className="font-serif text-xl text-ink">Delivery details</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            We'll autofill these on your next order.
          </p>
          <div className="mt-5 grid gap-4">
            <Field
              label="Name"
              value={form.name ?? ""}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Phone"
              type="tel"
              value={form.phone ?? ""}
              onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="+91"
            />
            <Field
              label="Delivery address"
              value={form.address ?? ""}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="Sector, flat / house"
            />
            <Field
              label="Hostel / landmark"
              value={form.landmark ?? ""}
              onChange={(v) => setForm({ ...form, landmark: v })}
              placeholder="e.g. NIT Hostel 7"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-cream hover:bg-clay disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save details
          </button>
        </form>

        <div className="md:col-span-3">
          <h2 className="font-serif text-xl text-ink">Order history</h2>
          <p className="text-xs text-muted-foreground">Your recent orders.</p>
          <div className="mt-5 space-y-3">
            {ordersQuery.isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {ordersQuery.data?.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No orders yet. <Link to="/" className="underline hover:text-clay">Browse today's menu</Link>.
              </div>
            )}
            {ordersQuery.data?.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {o.code}
                    </div>
                    <div className="mt-0.5 font-medium text-ink">
                      {o.dish_name}{" "}
                      <span className="text-muted-foreground">× {o.quantity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                      {o.slot ? ` · ${o.slot}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-lg text-ink">
                      {kitchen.currencySymbol}
                      {o.price * o.quantity}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay">
                      {o.status.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-clay"
      />
    </div>
  );
}
