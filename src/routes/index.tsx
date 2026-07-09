import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock, MapPin, Plus, Search, Sparkles, X } from "lucide-react";
import cookPortrait from "@/assets/cook-illustration.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { useReveal } from "@/hooks/use-reveal";
import { useAuth } from "@/hooks/use-auth";
import { whatsappUrl, type Dish } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import { menuQueryOptions, weeklyMenuQueryOptions } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { MealPlansSection } from "@/components/meal-plans";
import { fetchProfile } from "@/lib/profile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(menuQueryOptions);
    void context.queryClient.prefetchQuery(weeklyMenuQueryOptions);
  },
  component: Home,
});

function useTodayLabel() {
  const [label, setLabel] = useState<string>("Today");
  useEffect(() => {
    setLabel(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);
  return label;
}

/* ---------- shared bits ---------- */

function Eyebrow({
  children,
  tone = "clay",
}: {
  children: React.ReactNode;
  tone?: "clay" | "haldi" | "cream";
}) {
  const color = tone === "haldi" ? "text-haldi" : tone === "cream" ? "text-cream/70" : "text-clay";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-[0.28em] ${color}`}>{children}</span>
  );
}

function Rule({ className = "" }: { className?: string }) {
  return <span className={`inline-block h-px w-10 bg-clay/60 ${className}`} />;
}

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <SiteHeader />
      <MenuTopBar />
      <Menu />
      <MealPlansSection />
      <CookNote />
      <HowItWorks />
      <KitchensStrip />
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}

/* ---------- Compact top bar (Zomato-style quick info above the menu) ---------- */

function MenuTopBar() {
  const today = useTodayLabel();
  const items = [
    { k: "Today", v: today },
    { k: "Lunch by", v: kitchen.timing.lunchBy },
    { k: "Dinner by", v: kitchen.timing.dinnerBy },
    { k: "Delivery", v: kitchen.delivery.zones },
  ];
  return (
    <section aria-label="Kitchen status" className="border-b border-border/70 bg-background">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-5 py-3 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-leaf">
          <span className="h-1.5 w-1.5 rounded-full bg-leaf" /> Kitchen open
        </span>
        {items.map((it) => (
          <span
            key={it.k}
            suppressHydrationWarning
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/10 bg-cream/60 px-3 py-1 text-[11px] text-ink/80"
          >
            <MapPin className="h-3 w-3 text-clay" />
            <span className="font-bold uppercase tracking-[0.18em] text-muted-foreground text-[9.5px]">
              {it.k}
            </span>
            <span className="font-serif italic text-ink">{it.v}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- ABOUT ---------- */
/* ---------- MENU ---------- */

/* ---------- MENU ---------- */

const SPICE_BY_KEY: Record<string, 1 | 2 | 3> = {
  dalma: 2,
  santula: 1,
  "aloo-poori": 2,
  pakhala: 1,
  khechedi: 1,
  "dahi-baigana": 1,
  "ghanta-tarkari": 2,
  gupchup: 3,
  "chhena-poda": 1,
  kheeri: 1,
};

const spiceLabel = (n: 1 | 2 | 3) => (n === 1 ? "Mild" : n === 2 ? "Medium" : "Spicy");

type SpiceFilter = "all" | 1 | 2 | 3;
type MealFilter = "all" | "Lunch" | "Dinner" | "Snack";

function Menu() {
  const { data: dishes = [], isLoading } = useQuery(menuQueryOptions);
  const { add, openCart } = useCart();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealFilter>("all");
  const [spice, setSpice] = useState<SpiceFilter>("all");

  // After sign-in, check for pending order stored in localStorage
  useEffect(() => {
    if (!ready || !user) return;
    const raw = localStorage.getItem("pendingOrder");
    if (!raw) return;
    localStorage.removeItem("pendingOrder");
    try {
      const order = JSON.parse(raw);
      if (order.action === "add-to-cart") {
        add(order.dish);
        openCart();
      } else if (order.action === "open-cart") {
        openCart();
      }
    } catch {
      // ignore parse errors
    }
  }, [ready, user, add, openCart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q) && !d.desc.toLowerCase().includes(q)) return false;
      if (meal !== "all" && d.meal !== meal) return false;
      const s = SPICE_BY_KEY[d.key] ?? 1;
      if (spice !== "all" && s !== spice) return false;
      return true;
    });
  }, [dishes, query, meal, spice]);

  const hasFilters = query || meal !== "all" || spice !== "all";
  const clear = () => {
    setQuery("");
    setMeal("all");
    setSpice("all");
  };

  const mealOpts: MealFilter[] = ["all", "Lunch", "Dinner", "Snack"];
  const spiceOpts: { v: SpiceFilter; label: string }[] = [
    { v: "all", label: "All" },
    { v: 1, label: "Mild" },
    { v: 2, label: "Medium" },
    { v: 3, label: "Spicy" },
  ];

  return (
    <section id="menu" className="border-t border-border/70 bg-cream/60">
      <div className="mx-auto max-w-6xl px-5 pt-20 md:px-8 md:pt-28">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 border-b border-ink/10 pb-6 md:gap-8">
          <div className="min-w-0">
            <Eyebrow>Today's board</Eyebrow>
            <h2 className="mt-3 font-serif text-[2rem] leading-[0.95] tracking-tight text-ink md:text-5xl">
              Ten dishes,
              <span className="italic text-clay"> cooked once,</span>
              <br className="hidden sm:block" /> served fresh.
            </h2>
          </div>
          <a
            href={whatsappUrl("Hi! Please share today's full menu.")}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 self-end border-b border-haldi pb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-ink transition-colors hover:text-clay"
          >
            The full menu
          </a>
        </div>

        {/* Search + filters */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-full rounded-full border border-ink/15 bg-background py-3 pl-10 pr-10 text-sm text-ink placeholder:text-muted-foreground/70 focus:border-clay/60 focus:outline-none focus:ring-2 focus:ring-clay/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-ink/5 hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <FilterGroup label="Meal">
              {mealOpts.map((m) => (
                <FilterChip key={m} active={meal === m} onClick={() => setMeal(m)}>
                  {m === "all" ? "All" : m}
                </FilterChip>
              ))}
            </FilterGroup>
            <FilterGroup label="Spice">
              {spiceOpts.map((s) => (
                <FilterChip key={String(s.v)} active={spice === s.v} onClick={() => setSpice(s.v)}>
                  {s.label}
                </FilterChip>
              ))}
            </FilterGroup>
          </div>
        </div>
      </div>

      {/* Compact 2-col grid on mobile, roomier on desktop */}
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-10">
        {isLoading && dishes.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Loading today's menu…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No dishes match your search.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clear}
                className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-clay hover:text-ink"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 md:gap-x-7 md:gap-y-12">
            {filtered.map((dish, i) => (
              <MenuCard
                key={dish.id}
                dish={dish}
                index={i}
                spice={SPICE_BY_KEY[dish.key] ?? 1}
                onOrder={() => {
                  if (!user) {
                    localStorage.setItem(
                      "pendingOrder",
                      JSON.stringify({
                        dish: {
                          key: dish.key,
                          name: dish.name,
                          price: dish.price,
                          meal: dish.meal,
                          image: dish.image,
                        },
                        action: "add-to-cart",
                      }),
                    );
                    navigate({ to: "/auth" });
                    return;
                  }
                  add(dish);
                  toast.success(`Added ${dish.name}`);
                  openCart();
                }}
                onOrderNow={() => {
                  if (!user) {
                    localStorage.setItem(
                      "pendingOrder",
                      JSON.stringify({
                        dish: {
                          key: dish.key,
                          name: dish.name,
                          price: dish.price,
                          meal: dish.meal,
                          image: dish.image,
                        },
                        action: "order-now",
                      }),
                    );
                    navigate({ to: "/auth" });
                    return;
                  }
                  // Signed-in user: open WhatsApp directly
                  fetchProfile(user.id).then((p) => {
                    const name = p?.name || user.email || "";
                    const phone = p?.phone || "";
                    const address = p?.address || "";
                    const landmark = p?.landmark || "";
                    const lines = [
                      `Order from ${kitchen.brand.name}`,
                      `1 × ${dish.name} — ${kitchen.currencySymbol}${dish.price}`,
                      `Name: ${name}`,
                      `Phone: ${phone}`,
                      `Address: ${address}${landmark ? ` · ${landmark}` : ""}`,
                    ]
                      .filter(Boolean)
                      .join("\n");
                    window.open(whatsappUrl(lines), "_blank", "noopener,noreferrer");
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
        active
          ? "border-ink bg-ink text-cream"
          : "border-ink/15 bg-background text-ink hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}

function MenuCard({
  dish,
  index,
  spice,
  onOrder,
  onOrderNow,
}: {
  dish: Dish;
  index: number;
  spice: 1 | 2 | 3;
  onOrder: () => void;
  onOrderNow: () => void;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <article
      ref={ref}
      style={{ transitionDelay: `${Math.min(index, 6) * 50}ms` }}
      className={`group relative flex flex-col transition-all duration-500 ease-out hover:-translate-y-0.5 reveal ${
        shown ? "reveal-in" : ""
      }`}
    >
      <button
        type="button"
        onClick={dish.soldOut ? undefined : onOrder}
        disabled={dish.soldOut}
        aria-label={dish.soldOut ? `${dish.name} sold out` : `Order ${dish.name}`}
        className="relative aspect-square w-full overflow-hidden rounded-[2px] bg-muted text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:cursor-not-allowed md:aspect-[4/5]"
      >
        <img
          src={dish.image}
          alt={dish.name}
          loading="lazy"
          width={800}
          height={800}
          className={`h-full w-full object-cover transition-all duration-[1200ms] ease-out group-hover:scale-[1.06] ${
            dish.soldOut ? "grayscale-[35%]" : ""
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />

        <span
          aria-label={dish.veg ? "Vegetarian" : "Non-vegetarian"}
          className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-[2px] border border-cream/80 bg-cream/90"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dish.veg ? "bg-leaf" : "bg-clay"}`} />
        </span>

        {dish.signature && (
          <span className="absolute right-0 top-3 flex items-center gap-1 bg-clay py-0.5 pl-1.5 pr-2 text-[8px] font-bold uppercase tracking-[0.22em] text-cream shadow-sm">
            <Sparkles className="h-2 w-2" /> Signature
          </span>
        )}
        {dish.soldOut && (
          <span className="absolute right-2 top-2 rounded-[2px] bg-ink/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.22em] text-cream backdrop-blur">
            Sold out
          </span>
        )}
      </button>

      <div className="pt-3">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          <span>{dish.meal}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />
          <span className="text-clay">{spiceLabel(spice)}</span>
        </div>
        <h3 className="dish-title mt-1.5 text-[1.15rem] leading-[1.1] text-ink transition-colors duration-300 group-hover:text-clay md:text-[1.6rem]">
          {dish.name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span
            aria-hidden
            className="flex-1 translate-y-[-3px] border-b border-dotted border-ink/25"
          />
          <span className="font-serif text-base text-ink tabular md:text-lg">
            <span className="text-[10px] align-top text-muted-foreground">
              {kitchen.currencySymbol}
            </span>
            {dish.price}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.5] text-muted-foreground md:text-[13.5px]">
          {dish.desc}
        </p>

        <div className="mt-3 flex items-center gap-3">
          {dish.soldOut ? (
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
              Back tomorrow
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onOrder}
                className="group/btn inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:border-clay hover:text-clay"
              >
                <Plus className="h-3 w-3" />
                Add to order
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </button>
              <span className="text-[9px] text-muted-foreground/40">|</span>
              <button
                type="button"
                onClick={onOrderNow}
                className="group/btn inline-flex items-center gap-1 border-b border-leaf/50 pb-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-leaf transition-colors hover:border-leaf"
              >
                Order Now
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------- COOK NOTE ---------- */

function CookNote() {
  return (
    <section id="cook" className="border-t border-border/70">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[0.85fr_1.15fr] md:gap-20 md:px-8 md:py-28">
        <div className="relative">
          <div className="overflow-hidden rounded-t-[7rem] rounded-b-2xl border border-ink/5 shadow-[0_30px_80px_-40px_rgba(80,40,20,0.4)]">
            <img
              src={cookPortrait}
              alt={`Portrait of ${kitchen.cook.name}, the home cook, in her kitchen`}
              width={1024}
              height={1280}
              loading="lazy"
              className="h-[440px] w-full object-cover md:h-[600px]"
            />
          </div>
          <div className="absolute -right-3 top-6 rotate-3 rounded-full bg-haldi px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-ink shadow-md">
            The cook
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Eyebrow>A note from the kitchen</Eyebrow>
          <h2 className="mt-4 font-serif text-[2rem] leading-[1] tracking-tight text-ink md:text-[3rem]">
            Ghar ka khana,
            <span className="italic font-light text-clay"> delivered warm.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">
            Ten dishes a day, cooked by hand in a home kitchen — not a cloud kitchen, not a
            restaurant. Order what's on today's board on WhatsApp; we bring it hot.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <Rule />
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              A note from {kitchen.cook.name}
            </span>
          </div>
          <p className="measure mt-6 text-[15px] leading-[1.7] text-muted-foreground md:text-[16px]">
            {kitchen.cook.note}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- HOW IT WORKS ---------- */

function HowItWorks() {
  const steps = [
    {
      k: "01",
      title: "Order individually",
      subtitle: "Pick your favorite dishes",
      body: "Choose from today's menu and place your order on WhatsApp. Share your address and preferred delivery time.",
      badge: "Menu",
      illustration: <OrderArt />,
    },
    {
      k: "02",
      title: "Subscription plan",
      subtitle: "For students, bachelors, or anyone",
      body: "Subscribe for daily homemade meals. Healthy, balanced, and delivered on time—perfect for hostels and PGs.",
      badge: "Plans",
      illustration: <SubscriptionArt />,
    },
    {
      k: "03",
      title: "Pre-order booking",
      subtitle: "Plan ahead for functions",
      body: "Book meals in advance for birthdays, meetings, or gatherings. We prepare fresh, deliver hot, and handle the food.",
      badge: "Events",
      illustration: <PreorderArt />,
    },
  ];

  return (
    <section
      id="how"
      className="relative overflow-hidden border-t border-border/70 bg-ink text-cream"
    >
      {/* warm ink canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 12% 18%, color-mix(in oklab, var(--haldi) 10%, transparent) 0%, transparent 55%), radial-gradient(90% 70% at 92% 100%, color-mix(in oklab, var(--clay) 14%, transparent) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-haldi/10 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 top-4 select-none font-serif text-[8rem] leading-none italic text-cream/[0.07] md:-right-6 md:top-8 md:text-[16rem]"
      >
        घर
      </span>

      <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-haldi/70" />
              <Eyebrow tone="haldi">How it works</Eyebrow>
            </div>
            <h2 className="mt-3 font-serif text-[1.9rem] leading-[1] tracking-tight md:text-[2.75rem]">
              Three ways
              <span className="italic text-haldi"> to order.</span>
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-cream/60 md:text-[14px]">
              Choose the option that works best for you. Fresh, homemade food whenever you need it.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/70">
            <Clock className="h-3 w-3" />
            Order 24/7
          </div>
        </div>

        {/* Steps grid */}
        <div className="relative mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-[16.6%] top-[108px] hidden h-5 w-[66.8%] text-haldi/70 md:block"
            preserveAspectRatio="none"
            viewBox="0 0 1000 20"
            fill="none"
          >
            <path
              d="M0 10 C 180 -6, 340 24, 500 10 S 820 -4, 1000 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="1 7"
            />
          </svg>

          {steps.map((s) => (
            <div
              key={s.k}
              className="group relative flex flex-col rounded-2xl border border-cream/10 bg-cream/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-haldi/30 hover:bg-cream/[0.05] md:p-7"
            >
              <div className="relative mx-auto flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-cream/[0.07] via-cream/[0.02] to-transparent md:h-40">
                <div className="absolute inset-x-6 bottom-3 h-px bg-haldi/25" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 30%, var(--haldi) 0.5px, transparent 0.6px), radial-gradient(circle at 70% 60%, var(--cream) 0.5px, transparent 0.6px)",
                    backgroundSize: "22px 22px, 30px 30px",
                  }}
                />
                {s.illustration}
              </div>

              <div className="mt-5 flex items-baseline gap-3 md:mt-6">
                <span className="font-serif text-xl italic text-haldi">{s.k}</span>
                <span className="h-px flex-1 bg-cream/10" />
                <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-cream/50">
                  {s.badge}
                </span>
              </div>
              <h3 className="mt-2.5 font-serif text-lg leading-tight text-cream md:mt-3 md:text-[1.4rem]">
                {s.title}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-cream/70 md:text-[12px]">
                {s.subtitle}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-cream/60 md:text-[13px]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Hand-drawn SVG illustrations for How it Works ---------- */

function OrderArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* Phone body */}
      <rect
        x="50"
        y="22"
        width="68"
        height="110"
        rx="6"
        fill="color-mix(in oklab, var(--cream) 20%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 70%, transparent)"
        strokeWidth="1.2"
      />
      <rect
        x="52"
        y="24"
        width="64"
        height="106"
        rx="5"
        fill="color-mix(in oklab, var(--cream) 95%, transparent)"
        stroke="color-mix(in oklab, var(--cream) 60%, transparent)"
        strokeWidth="0.8"
      />

      {/* Notch */}
      <rect x="75" y="24" width="18" height="5" rx="2" fill="var(--ink)" />

      {/* Menu items on screen */}
      <g>
        {/* Item 1 */}
        <circle
          cx="60"
          cy="42"
          r="4.5"
          fill="color-mix(in oklab, var(--haldi) 65%, transparent)"
          stroke="color-mix(in oklab, var(--haldi) 85%, transparent)"
          strokeWidth="0.8"
        />
        <text x="68" y="45" fontFamily="DM Sans" fontSize="8" fill="var(--ink)" fontWeight="600">
          Dal Tadka
        </text>
        <text
          x="68"
          y="54"
          fontFamily="DM Sans"
          fontSize="6.5"
          fill="color-mix(in oklab, var(--ink) 55%, transparent)"
        >
          ₹90
        </text>

        {/* Item 2 */}
        <circle
          cx="60"
          cy="70"
          r="4.5"
          fill="color-mix(in oklab, var(--clay) 55%, transparent)"
          stroke="color-mix(in oklab, var(--clay) 80%, transparent)"
          strokeWidth="0.8"
        />
        <text x="68" y="73" fontFamily="DM Sans" fontSize="8" fill="var(--ink)" fontWeight="600">
          Paneer Curry
        </text>
        <text
          x="68"
          y="82"
          fontFamily="DM Sans"
          fontSize="6.5"
          fill="color-mix(in oklab, var(--ink) 55%, transparent)"
        >
          ₹110
        </text>

        {/* Item 3 */}
        <circle
          cx="60"
          cy="98"
          r="4.5"
          fill="color-mix(in oklab, var(--leaf) 50%, transparent)"
          stroke="color-mix(in oklab, var(--leaf) 75%, transparent)"
          strokeWidth="0.8"
        />
        <text x="68" y="101" fontFamily="DM Sans" fontSize="8" fill="var(--ink)" fontWeight="600">
          Mix Veg
        </text>
        <text
          x="68"
          y="110"
          fontFamily="DM Sans"
          fontSize="6.5"
          fill="color-mix(in oklab, var(--ink) 55%, transparent)"
        >
          ₹90
        </text>
      </g>

      {/* Plus buttons */}
      <text x="110" y="46" fontFamily="DM Sans" fontSize="14" fill="var(--clay)" fontWeight="bold">
        +
      </text>
      <text x="110" y="74" fontFamily="DM Sans" fontSize="14" fill="var(--clay)" fontWeight="bold">
        +
      </text>
      <text x="110" y="102" fontFamily="DM Sans" fontSize="14" fill="var(--clay)" fontWeight="bold">
        +
      </text>

      {/* WhatsApp icon bubble */}
      <circle
        cx="155"
        cy="75"
        r="18"
        fill="color-mix(in oklab, var(--leaf) 70%, transparent)"
        stroke="color-mix(in oklab, var(--leaf) 90%, transparent)"
        strokeWidth="1.2"
      />
      <text
        x="155"
        y="82"
        fontFamily="DM Sans"
        fontSize="16"
        fill="var(--cream)"
        fontWeight="bold"
        textAnchor="middle"
      >
        ✓✓
      </text>
    </svg>
  );
}

function SubscriptionArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* Calendar card background */}
      <rect
        x="35"
        y="20"
        width="90"
        height="100"
        rx="4"
        fill="color-mix(in oklab, var(--cream) 90%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 60%, transparent)"
        strokeWidth="1"
      />

      {/* Calendar header */}
      <rect
        x="35"
        y="20"
        width="90"
        height="18"
        rx="4"
        fill="color-mix(in oklab, var(--haldi) 50%, transparent)"
      />
      <text
        x="80"
        y="32"
        fontFamily="Fraunces"
        fontSize="9"
        fill="var(--cream)"
        fontWeight="bold"
        textAnchor="middle"
      >
        JUNE 2025
      </text>

      {/* Calendar grid */}
      {Array.from({ length: 20 }).map((_, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = 42 + col * 16;
        const y = 42 + row * 15;
        const isFilled = i % 3 === 0;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width="14"
              height="13"
              rx="1.5"
              fill={isFilled ? "color-mix(in oklab, var(--haldi) 35%, transparent)" : "transparent"}
              stroke={
                isFilled
                  ? "color-mix(in oklab, var(--haldi) 70%, transparent)"
                  : "color-mix(in oklab, var(--ink) 15%, transparent)"
              }
              strokeWidth="0.5"
            />
            <text
              x={x + 7}
              y={y + 9}
              fontFamily="DM Sans"
              fontSize="5.5"
              fill={isFilled ? "var(--ink)" : "var(--ink)"}
              textAnchor="middle"
              fontWeight={isFilled ? "600" : "400"}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Checkmark badge */}
      <circle
        cx="155"
        cy="50"
        r="16"
        fill="color-mix(in oklab, var(--leaf) 60%, transparent)"
        stroke="color-mix(in oklab, var(--leaf) 90%, transparent)"
        strokeWidth="1.2"
      />
      <path
        d="M150 50 L153 53 L160 46"
        stroke="var(--cream)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Text benefits */}
      <text x="135" y="75" fontFamily="DM Sans" fontSize="7" fill="var(--ink)" fontWeight="bold">
        Hassle-Free
      </text>
      <text x="135" y="85" fontFamily="DM Sans" fontSize="7" fill="var(--ink)" fontWeight="bold">
        Homely
      </text>
      <text x="135" y="95" fontFamily="DM Sans" fontSize="7" fill="var(--ink)" fontWeight="bold">
        Affordable
      </text>
    </svg>
  );
}

function PreorderArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* Decorative circles as food */}
      {/* Thali bowl */}
      <circle
        cx="80"
        cy="70"
        r="35"
        fill="color-mix(in oklab, var(--cream) 85%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 70%, transparent)"
        strokeWidth="2"
      />
      <circle
        cx="80"
        cy="70"
        r="30"
        fill="color-mix(in oklab, var(--haldi) 30%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 65%, transparent)"
        strokeWidth="1"
      />

      {/* Food items on thali */}
      <circle
        cx="65"
        cy="55"
        r="6"
        fill="color-mix(in oklab, var(--clay) 70%, transparent)"
        stroke="color-mix(in oklab, var(--clay) 90%, transparent)"
        strokeWidth="0.8"
      />
      <circle
        cx="95"
        cy="55"
        r="6"
        fill="color-mix(in oklab, var(--haldi) 70%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 90%, transparent)"
        strokeWidth="0.8"
      />
      <circle
        cx="80"
        cy="80"
        r="6"
        fill="color-mix(in oklab, var(--leaf) 60%, transparent)"
        stroke="color-mix(in oklab, var(--leaf) 85%, transparent)"
        strokeWidth="0.8"
      />

      {/* Roti */}
      <path
        d="M60 88 q 15 0 30 0 a15 15 0 0 1 0 8 q -15 0 -30 0 a15 15 0 0 1 0 -8"
        fill="color-mix(in oklab, var(--haldi) 50%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 75%, transparent)"
        strokeWidth="0.8"
      />

      {/* Package/gift box */}
      <g transform="translate(155, 70)">
        <rect
          x="-12"
          y="-12"
          width="24"
          height="24"
          rx="2"
          fill="color-mix(in oklab, var(--clay) 35%, transparent)"
          stroke="color-mix(in oklab, var(--clay) 80%, transparent)"
          strokeWidth="1.2"
        />
        <rect
          x="-10"
          y="-10"
          width="20"
          height="20"
          rx="1"
          fill="color-mix(in oklab, var(--clay) 50%, transparent)"
        />
        <path
          d="M-10 0 L10 0 M0 -10 L0 10"
          stroke="color-mix(in oklab, var(--cream) 70%, transparent)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Gift bow */}
        <circle cx="0" cy="-10" r="2" fill="var(--haldi)" />
      </g>

      {/* Party balloons */}
      <g transform="translate(145, 35)">
        <circle cx="0" cy="0" r="4" fill="color-mix(in oklab, var(--clay) 80%, transparent)" />
        <line
          x1="0"
          y1="4"
          x2="0"
          y2="12"
          stroke="color-mix(in oklab, var(--cream) 60%, transparent)"
          strokeWidth="0.6"
        />
      </g>
      <g transform="translate(165, 40)">
        <circle cx="0" cy="0" r="4" fill="color-mix(in oklab, var(--haldi) 80%, transparent)" />
        <line
          x1="0"
          y1="4"
          x2="0"
          y2="12"
          stroke="color-mix(in oklab, var(--cream) 60%, transparent)"
          strokeWidth="0.6"
        />
      </g>
    </svg>
  );
}

/* ---------- KITCHENS ---------- */

function KitchensStrip() {
  return (
    <section className="relative overflow-hidden border-t border-clay/20 bg-clay text-cream">
      {/* Decorative typographic backdrop */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 -top-10 select-none font-serif text-[10rem] leading-none italic text-cream/[0.06] md:-left-2 md:-top-16 md:text-[16rem]"
      >
        रसोई
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-20 select-none font-serif text-[14rem] leading-none italic text-haldi/[0.12] md:-right-4 md:text-[22rem]"
      >
        &amp;
      </span>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-haldi/50 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end md:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-haldi/70" />
              <Eyebrow tone="cream">Now hiring home cooks</Eyebrow>
            </div>
            <h2 className="mt-4 font-serif text-[2.25rem] leading-[0.98] tracking-tight md:text-[3.25rem]">
              Join as a cook
              <br />
              <span className="italic text-haldi">&amp; rasoori.</span>
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-cream/80 md:text-[15px]">
              Cook from your own kitchen. List a few chosen dishes. We handle the orders, the
              delivery, and the customers — you handle the flavour.
            </p>

            {/* Perks strip */}
            <ul className="mt-8 grid grid-cols-2 gap-3 border-t border-cream/15 pt-6 md:max-w-md md:gap-4">
              {[
                { k: "Cook", v: "3–10 dishes" },
                { k: "Own", v: "Your hours" },
              ].map((p) => (
                <li key={p.k} className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-haldi/90">
                    {p.k}
                  </div>
                  <div className="mt-1 font-serif text-base italic text-cream md:text-lg">
                    {p.v}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <Link
              to="/kitchens/apply"
              className="group inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-ink transition-all hover:-translate-y-0.5 hover:bg-haldi hover:shadow-[0_20px_40px_-16px_rgba(0,0,0,0.4)]"
            >
              Join as a cook
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/70">
              <span>2-min form</span>
              <span className="h-1 w-1 rounded-full bg-cream/40" />
              <span>We call you back</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
