import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock, MapPin, Plus, Search, Sparkles, X } from "lucide-react";
import cookPortrait from "@/assets/cook-illustration.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { useReveal } from "@/hooks/use-reveal";
import { whatsappUrl, type Dish } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import { menuQueryOptions, weeklyMenuQueryOptions } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { MealPlansSection } from "@/components/meal-plans";
import { toast } from "sonner";

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

function Eyebrow({ children, tone = "clay" }: { children: React.ReactNode; tone?: "clay" | "haldi" | "cream" }) {
  const color =
    tone === "haldi" ? "text-haldi" : tone === "cream" ? "text-cream/70" : "text-clay";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-[0.28em] ${color}`}>
      {children}
    </span>
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
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealFilter>("all");
  const [spice, setSpice] = useState<SpiceFilter>("all");

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
          <div className="py-16 text-center text-sm text-muted-foreground">Loading today's menu…</div>
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
                  add(dish);
                  toast.success(`Added ${dish.name}`);
                  openCart();
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
}: {
  dish: Dish;
  index: number;
  spice: 1 | 2 | 3;
  onOrder: () => void;
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
            <span className="text-[10px] align-top text-muted-foreground">{kitchen.currencySymbol}</span>
            {dish.price}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.5] text-muted-foreground md:text-[13.5px]">
          {dish.desc}
        </p>

        <div className="mt-3">
          {dish.soldOut ? (
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
              Back tomorrow
            </span>
          ) : (
            <button
              type="button"
              onClick={onOrder}
              className="group/btn inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ink transition-colors hover:border-clay hover:text-clay"
            >
              <Plus className="h-3 w-3" />
              Add to order
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
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
      tag: "Choose",
      title: "Pick from today's board",
      body: "Ten dishes, freshly written on the board each morning.",
      illustration: <ChalkboardArt />,
    },
    {
      k: "02",
      tag: "Message",
      title: "A quick note on WhatsApp",
      body: "Dish, quantity, address, slot. We reply within minutes — just like family.",
      illustration: <WhatsAppNoteArt />,
    },
    {
      k: "03",
      tag: "Eat",
      title: "Tiffin at your door, still warm",
      body: `${kitchen.delivery.extendedZones}. Pay by COD or UPI.`,
      illustration: <TiffinArt />,
    },
  ];
  return (
    <section id="how" className="relative overflow-hidden border-t border-border/70 bg-ink text-cream">
      {/* warm ink canvas: subtle radial warmth so the ink feels lit, not flat */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 12% 18%, color-mix(in oklab, var(--haldi) 10%, transparent) 0%, transparent 55%), radial-gradient(90% 70% at 92% 100%, color-mix(in oklab, var(--clay) 14%, transparent) 0%, transparent 60%)",
        }}
      />
      {/* soft haldi glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-haldi/10 blur-3xl"
      />
      {/* devanagari watermark, echoing the brand */}
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
              As simple as
              <span className="italic text-haldi"> calling home.</span>
            </h2>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-cream/60 md:text-[14px]">
              No app to download, no dark patterns. Three small steps between you and a hot,
              hand-cooked meal.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cream/70">
            <Clock className="h-3 w-3" />
            Lunch {kitchen.timing.lunchOrderTime} · Dinner {kitchen.timing.dinnerOrderTime}
          </div>
        </div>

        {/* Illustrated steps */}
        <ol className="relative mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
          {/* dashed thread connecting the three illustration midlines, desktop only */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-[16.6%] top-[124px] hidden h-5 w-[66.8%] text-haldi/70 md:block"
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
            <li
              key={s.k}
              className="group relative flex flex-col rounded-2xl border border-cream/10 bg-cream/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-haldi/30 hover:bg-cream/[0.05] md:p-7"
            >
              {/* illustration card */}
              <div className="relative mx-auto flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-cream/[0.06] to-transparent">
                <div className="absolute inset-x-6 bottom-3 h-px bg-haldi/20" />
                {s.illustration}
              </div>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-serif text-xl italic text-haldi">{s.k}</span>
                <span className="h-px flex-1 bg-cream/10" />
                <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-cream/50">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl leading-tight text-cream md:text-[1.4rem]">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-cream/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Hand-drawn SVG illustrations for How it Works ---------- */

function ChalkboardArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* board */}
      <rect x="28" y="18" width="164" height="104" rx="6" fill="var(--ink)" stroke="color-mix(in oklab, var(--haldi) 55%, transparent)" strokeWidth="1.5" />
      <rect x="28" y="18" width="164" height="104" rx="6" fill="color-mix(in oklab, var(--cream) 4%, transparent)" />
      {/* chalk title */}
      <text x="110" y="42" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="14" fill="var(--haldi)">
        Today's Board
      </text>
      <line x1="70" y1="50" x2="150" y2="50" stroke="color-mix(in oklab, var(--haldi) 50%, transparent)" strokeWidth="0.8" />
      {/* chalk menu lines */}
      {[62, 74, 86, 98].map((y, i) => (
        <g key={y} opacity={0.75}>
          <circle cx="46" cy={y} r="1.6" fill="var(--haldi)" />
          <line x1="54" y1={y} x2={130 + (i % 2) * 20} y2={y} stroke="color-mix(in oklab, var(--cream) 55%, transparent)" strokeWidth="1" strokeLinecap="round" />
          <line x1={145 + (i % 2) * 15} y1={y} x2="170" y2={y} stroke="color-mix(in oklab, var(--cream) 35%, transparent)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
        </g>
      ))}
      {/* easel legs */}
      <line x1="60" y1="122" x2="46" y2="138" stroke="color-mix(in oklab, var(--cream) 35%, transparent)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="160" y1="122" x2="174" y2="138" stroke="color-mix(in oklab, var(--cream) 35%, transparent)" strokeWidth="1.5" strokeLinecap="round" />
      {/* steam / sparkle */}
      <path d="M180 30 q 4 -6 0 -12" stroke="var(--haldi)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="188" cy="14" r="1.6" fill="var(--haldi)" />
    </svg>
  );
}

function WhatsAppNoteArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* incoming bubble */}
      <path
        d="M30 40 h100 a10 10 0 0 1 10 10 v22 a10 10 0 0 1 -10 10 h-88 l-14 12 v-12 a10 10 0 0 1 -8 -10 v-22 a10 10 0 0 1 10 -10 z"
        fill="color-mix(in oklab, var(--cream) 8%, transparent)"
        stroke="color-mix(in oklab, var(--cream) 25%, transparent)"
        strokeWidth="1"
      />
      <line x1="42" y1="54" x2="118" y2="54" stroke="color-mix(in oklab, var(--cream) 55%, transparent)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="42" y1="62" x2="102" y2="62" stroke="color-mix(in oklab, var(--cream) 40%, transparent)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="42" y1="70" x2="90" y2="70" stroke="color-mix(in oklab, var(--cream) 30%, transparent)" strokeWidth="1.2" strokeLinecap="round" />

      {/* reply bubble - haldi */}
      <path
        d="M190 78 h-70 a10 10 0 0 0 -10 10 v18 a10 10 0 0 0 10 10 h60 l14 10 v-10 a10 10 0 0 0 6 -10 v-18 a10 10 0 0 0 -10 -10 z"
        fill="color-mix(in oklab, var(--haldi) 18%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 60%, transparent)"
        strokeWidth="1"
      />
      <text x="128" y="98" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="11" fill="var(--haldi)">
        ji, confirmed ✓
      </text>
      <line x1="128" y1="106" x2="180" y2="106" stroke="color-mix(in oklab, var(--haldi) 50%, transparent)" strokeWidth="1" strokeLinecap="round" />

      {/* tiny WhatsApp mark */}
      <circle cx="30" cy="30" r="7" fill="var(--haldi)" />
      <path
        d="M27.5 27 c 0 3 2 5 5 5 l1 -1 -1.5 -0.8 -0.8 0.6 c -1 -0.4 -1.7 -1.1 -2.1 -2.1 l 0.6 -0.8 -0.8 -1.5 z"
        fill="var(--ink)"
      />
    </svg>
  );
}

function TiffinArt() {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* steam wisps */}
      {[70, 90, 110].map((x, i) => (
        <path
          key={x}
          d={`M${x} 26 q ${i % 2 === 0 ? 6 : -6} -10 0 -18`}
          stroke="color-mix(in oklab, var(--haldi) 70%, transparent)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      ))}
      {/* handle */}
      <path d="M75 38 q 15 -14 30 0" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="75" cy="38" r="2" fill="color-mix(in oklab, var(--cream) 80%, transparent)" />
      <circle cx="105" cy="38" r="2" fill="color-mix(in oklab, var(--cream) 80%, transparent)" />
      {/* tiffin tiers */}
      <g>
        <rect x="60" y="40" width="60" height="18" rx="3" fill="color-mix(in oklab, var(--cream) 10%, transparent)" stroke="color-mix(in oklab, var(--cream) 55%, transparent)" strokeWidth="1.2" />
        <rect x="58" y="58" width="64" height="18" rx="3" fill="color-mix(in oklab, var(--haldi) 22%, transparent)" stroke="color-mix(in oklab, var(--haldi) 60%, transparent)" strokeWidth="1.2" />
        <rect x="56" y="76" width="68" height="20" rx="3" fill="color-mix(in oklab, var(--cream) 10%, transparent)" stroke="color-mix(in oklab, var(--cream) 55%, transparent)" strokeWidth="1.2" />
        {/* clasps */}
        <line x1="56" y1="48" x2="56" y2="94" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="124" y1="48" x2="124" y2="94" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* doormat / floor line */}
      <line x1="30" y1="112" x2="190" y2="112" stroke="color-mix(in oklab, var(--cream) 25%, transparent)" strokeWidth="1" strokeDasharray="3 4" />
      {/* address tag */}
      <g transform="translate(140 60) rotate(8)">
        <rect x="0" y="0" width="52" height="30" rx="2" fill="color-mix(in oklab, var(--cream) 90%, transparent)" />
        <circle cx="4" cy="6" r="1.5" fill="var(--ink)" />
        <line x1="8" y1="10" x2="46" y2="10" stroke="var(--ink)" strokeWidth="0.8" />
        <line x1="8" y1="16" x2="40" y2="16" stroke="color-mix(in oklab, var(--ink) 70%, transparent)" strokeWidth="0.8" />
        <line x1="8" y1="22" x2="34" y2="22" stroke="color-mix(in oklab, var(--ink) 50%, transparent)" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="-8" y2="-6" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1" />
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

