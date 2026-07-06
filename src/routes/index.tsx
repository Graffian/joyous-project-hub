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
            <li
              key={s.k}
              className="group relative flex flex-col rounded-2xl border border-cream/10 bg-cream/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-haldi/30 hover:bg-cream/[0.05] md:p-7"
            >
              {/* illustration card */}
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
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-2.5 font-serif text-lg leading-tight text-cream md:mt-3 md:text-[1.4rem]">
                {s.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-cream/60 md:text-[13px]">{s.body}</p>
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
    // A brass thali, top-down. Small bowls of dal, sabzi, rice, roti — the "board" you pick from.
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* soft ground shadow */}
      <ellipse cx="110" cy="118" rx="70" ry="6" fill="color-mix(in oklab, var(--ink) 40%, transparent)" opacity="0.35" />
      {/* brass thali rim */}
      <circle cx="110" cy="72" r="52" fill="color-mix(in oklab, var(--haldi) 22%, transparent)" stroke="color-mix(in oklab, var(--haldi) 75%, transparent)" strokeWidth="1.4" />
      <circle cx="110" cy="72" r="46" fill="color-mix(in oklab, var(--cream) 8%, transparent)" stroke="color-mix(in oklab, var(--haldi) 35%, transparent)" strokeWidth="0.8" />
      {/* engraved dots around the rim */}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        const cx = 110 + Math.cos(a) * 49;
        const cy = 72 + Math.sin(a) * 49;
        return <circle key={i} cx={cx} cy={cy} r="0.7" fill="color-mix(in oklab, var(--haldi) 80%, transparent)" />;
      })}
      {/* katori: dal (haldi) */}
      <g>
        <circle cx="82" cy="56" r="10" fill="color-mix(in oklab, var(--haldi) 55%, transparent)" stroke="color-mix(in oklab, var(--haldi) 90%, transparent)" strokeWidth="1" />
        <circle cx="82" cy="56" r="6.5" fill="color-mix(in oklab, var(--haldi) 80%, transparent)" />
        <path d="M80 53 q 2 -1 4 0" stroke="var(--cream)" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
        {/* steam */}
        <path d="M78 42 q 3 -5 0 -10" stroke="color-mix(in oklab, var(--cream) 60%, transparent)" strokeWidth="1" strokeLinecap="round" />
        <path d="M84 44 q -3 -4 0 -9" stroke="color-mix(in oklab, var(--cream) 45%, transparent)" strokeWidth="1" strokeLinecap="round" />
      </g>
      {/* katori: sabzi (clay) */}
      <g>
        <circle cx="138" cy="56" r="10" fill="color-mix(in oklab, var(--clay) 40%, transparent)" stroke="color-mix(in oklab, var(--clay) 90%, transparent)" strokeWidth="1" />
        <circle cx="138" cy="56" r="6.5" fill="color-mix(in oklab, var(--clay) 65%, transparent)" />
        <circle cx="136" cy="55" r="1" fill="var(--haldi)" opacity="0.9" />
        <circle cx="140" cy="57" r="0.8" fill="var(--cream)" opacity="0.6" />
      </g>
      {/* rice mound */}
      <g>
        <ellipse cx="92" cy="88" rx="12" ry="6" fill="color-mix(in oklab, var(--cream) 85%, transparent)" stroke="color-mix(in oklab, var(--cream) 55%, transparent)" strokeWidth="0.8" />
        {[[-4,-1],[0,-2],[4,-1],[-2,1],[2,1]].map(([dx,dy],i)=>(
          <ellipse key={i} cx={92+dx} cy={87+dy} rx="1.2" ry="0.6" fill="color-mix(in oklab, var(--cream) 95%, transparent)" />
        ))}
      </g>
      {/* roti */}
      <g>
        <circle cx="130" cy="90" r="10" fill="color-mix(in oklab, var(--haldi) 25%, transparent)" stroke="color-mix(in oklab, var(--haldi) 60%, transparent)" strokeWidth="0.8" />
        <circle cx="128" cy="87" r="0.9" fill="color-mix(in oklab, var(--clay) 90%, transparent)" />
        <circle cx="132" cy="92" r="0.7" fill="color-mix(in oklab, var(--clay) 90%, transparent)" />
        <circle cx="127" cy="93" r="0.6" fill="color-mix(in oklab, var(--clay) 90%, transparent)" />
      </g>
      {/* leaf garnish */}
      <path d="M108 108 q 4 -3 8 0 q -4 3 -8 0 z" fill="color-mix(in oklab, var(--leaf) 70%, transparent)" />
      <line x1="108" y1="108" x2="118" y2="108" stroke="color-mix(in oklab, var(--leaf) 90%, transparent)" strokeWidth="0.5" />
      {/* tiny lemon */}
      <circle cx="118" cy="42" r="3" fill="color-mix(in oklab, var(--haldi) 85%, transparent)" stroke="color-mix(in oklab, var(--haldi) 95%, transparent)" strokeWidth="0.5" />
      <line x1="116" y1="42" x2="120" y2="42" stroke="color-mix(in oklab, var(--cream) 60%, transparent)" strokeWidth="0.4" />
    </svg>
  );
}

function WhatsAppNoteArt() {
  return (
    // A warm chai cup, its steam curling up into a WhatsApp speech bubble with a heart.
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* saucer */}
      <ellipse cx="76" cy="118" rx="42" ry="5" fill="color-mix(in oklab, var(--ink) 50%, transparent)" opacity="0.4" />
      <ellipse cx="76" cy="112" rx="34" ry="6" fill="color-mix(in oklab, var(--cream) 12%, transparent)" stroke="color-mix(in oklab, var(--cream) 45%, transparent)" strokeWidth="1" />
      {/* cup body */}
      <path
        d="M50 82 h52 l-4 26 a6 6 0 0 1 -6 5 h-32 a6 6 0 0 1 -6 -5 z"
        fill="color-mix(in oklab, var(--cream) 90%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 60%, transparent)"
        strokeWidth="1.2"
      />
      {/* cup rim & chai */}
      <ellipse cx="76" cy="82" rx="26" ry="4.5" fill="color-mix(in oklab, var(--clay) 55%, transparent)" stroke="color-mix(in oklab, var(--haldi) 70%, transparent)" strokeWidth="1" />
      <ellipse cx="72" cy="80.5" rx="6" ry="1" fill="color-mix(in oklab, var(--cream) 60%, transparent)" opacity="0.7" />
      {/* handle */}
      <path d="M102 88 q 12 4 0 18" stroke="color-mix(in oklab, var(--haldi) 60%, transparent)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {/* haldi stripe on cup */}
      <line x1="52" y1="92" x2="100" y2="92" stroke="color-mix(in oklab, var(--haldi) 55%, transparent)" strokeWidth="1" strokeDasharray="2 3" />

      {/* steam curls rising toward the bubble */}
      <path d="M64 74 q -6 -12 4 -22 q 6 -8 -2 -16" stroke="color-mix(in oklab, var(--cream) 45%, transparent)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M78 74 q 6 -10 -2 -20 q -6 -8 4 -16" stroke="color-mix(in oklab, var(--cream) 35%, transparent)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M90 74 q -4 -10 4 -18" stroke="color-mix(in oklab, var(--cream) 30%, transparent)" strokeWidth="1.2" strokeLinecap="round" />

      {/* WhatsApp-style bubble, right side */}
      <path
        d="M132 22 h58 a10 10 0 0 1 10 10 v28 a10 10 0 0 1 -10 10 h-46 l-10 10 v-10 h-2 a10 10 0 0 1 -10 -10 v-28 a10 10 0 0 1 10 -10 z"
        fill="color-mix(in oklab, var(--haldi) 22%, transparent)"
        stroke="color-mix(in oklab, var(--haldi) 65%, transparent)"
        strokeWidth="1.2"
      />
      {/* handwritten confirmation */}
      <text x="161" y="44" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="12" fill="var(--haldi)">
        ji, aa raha hai
      </text>
      {/* little heart */}
      <path d="M156 55 c -3 -3 -8 0 -6 4 c 1 3 6 6 6 6 s 5 -3 6 -6 c 2 -4 -3 -7 -6 -4 z"
            fill="color-mix(in oklab, var(--clay) 85%, transparent)" />
      {/* double check tick */}
      <path d="M170 58 l 3 3 l 6 -6 M175 58 l 3 3 l 6 -6" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TiffinArt() {
  return (
    // Stacked tiffin on a doorstep, an arched doorway glowing warm behind it.
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none" aria-hidden>
      {/* arched doorway with warm glow */}
      <defs>
        <radialGradient id="doorGlow" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="var(--haldi)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--haldi)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M78 118 v-58 a32 32 0 0 1 64 0 v58 z"
        fill="url(#doorGlow)"
        stroke="color-mix(in oklab, var(--haldi) 55%, transparent)"
        strokeWidth="1.2"
      />
      {/* door panel lines */}
      <line x1="110" y1="34" x2="110" y2="118" stroke="color-mix(in oklab, var(--haldi) 40%, transparent)" strokeWidth="0.6" strokeDasharray="2 3" />
      {/* door handle */}
      <circle cx="132" cy="90" r="1.4" fill="color-mix(in oklab, var(--haldi) 90%, transparent)" />

      {/* threshold / floor */}
      <line x1="20" y1="118" x2="200" y2="118" stroke="color-mix(in oklab, var(--cream) 30%, transparent)" strokeWidth="1" />
      <line x1="20" y1="122" x2="200" y2="122" stroke="color-mix(in oklab, var(--cream) 15%, transparent)" strokeWidth="0.6" strokeDasharray="2 4" />

      {/* soft shadow under tiffin */}
      <ellipse cx="60" cy="118" rx="26" ry="3" fill="color-mix(in oklab, var(--ink) 50%, transparent)" opacity="0.5" />

      {/* steam wisps */}
      {[52, 60, 68].map((x, i) => (
        <path
          key={x}
          d={`M${x} 58 q ${i === 1 ? 4 : -4} -8 ${i === 1 ? -2 : 2} -14 q ${i === 1 ? -3 : 3} -6 0 -10`}
          stroke="color-mix(in oklab, var(--cream) 55%, transparent)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {/* tiffin — three stacked tins with a curved handle */}
      <g>
        {/* handle */}
        <path d="M46 62 q 14 -16 28 0" stroke="color-mix(in oklab, var(--cream) 75%, transparent)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="62" r="1.8" fill="color-mix(in oklab, var(--cream) 85%, transparent)" />
        <circle cx="74" cy="62" r="1.8" fill="color-mix(in oklab, var(--cream) 85%, transparent)" />
        {/* lid */}
        <ellipse cx="60" cy="66" rx="22" ry="4" fill="color-mix(in oklab, var(--cream) 20%, transparent)" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1" />
        {/* tier 1 */}
        <rect x="38" y="66" width="44" height="14" rx="2" fill="color-mix(in oklab, var(--cream) 10%, transparent)" stroke="color-mix(in oklab, var(--cream) 60%, transparent)" strokeWidth="1.1" />
        {/* tier 2 — haldi */}
        <rect x="36" y="80" width="48" height="14" rx="2" fill="color-mix(in oklab, var(--haldi) 28%, transparent)" stroke="color-mix(in oklab, var(--haldi) 65%, transparent)" strokeWidth="1.1" />
        {/* tier 3 — clay */}
        <rect x="34" y="94" width="52" height="16" rx="2" fill="color-mix(in oklab, var(--clay) 24%, transparent)" stroke="color-mix(in oklab, var(--clay) 70%, transparent)" strokeWidth="1.1" />
        {/* clasps */}
        <line x1="34" y1="72" x2="34" y2="108" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="86" y1="72" x2="86" y2="108" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="34" cy="90" r="1.4" fill="color-mix(in oklab, var(--haldi) 90%, transparent)" />
        <circle cx="86" cy="90" r="1.4" fill="color-mix(in oklab, var(--haldi) 90%, transparent)" />
      </g>

      {/* handwritten address tag */}
      <g transform="translate(150 74) rotate(6)">
        <path d="M0 0 l 44 -6 l 4 24 l -46 6 z" fill="color-mix(in oklab, var(--cream) 90%, transparent)" stroke="color-mix(in oklab, var(--ink) 30%, transparent)" strokeWidth="0.6" />
        <line x1="6" y1="6" x2="40" y2="1" stroke="var(--ink)" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="6" y1="12" x2="36" y2="7.5" stroke="color-mix(in oklab, var(--ink) 70%, transparent)" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="6" y1="18" x2="30" y2="14" stroke="color-mix(in oklab, var(--ink) 45%, transparent)" strokeWidth="0.6" strokeLinecap="round" />
        {/* string */}
        <path d="M0 0 q -10 -6 -18 -2" stroke="color-mix(in oklab, var(--cream) 70%, transparent)" strokeWidth="0.8" fill="none" />
      </g>

      {/* tiny marigold on the threshold */}
      <g transform="translate(178 116)">
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * 2.2} cy={Math.sin(a) * 2.2} r="1.6" fill="color-mix(in oklab, var(--haldi) 80%, transparent)" />;
        })}
        <circle r="1.6" fill="var(--clay)" />
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

