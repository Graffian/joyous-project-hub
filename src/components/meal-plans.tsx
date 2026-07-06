import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Star,
  Truck,
  Utensils,
  Moon,
  Sun,
  Sparkles,
  Leaf,
  RefreshCw,
  Plus,
  Salad,
  CookingPot,
  Soup,
  Wheat,
  ChevronDown,
} from "lucide-react";
import { whatsappUrl } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import { weeklyMenuQueryOptions, type WeeklyMenuRow } from "@/lib/queries";
import { WhatsAppIcon } from "@/components/site-header";
import { imageForKey } from "@/lib/menu-images";
import heroThali from "@/assets/hero-thali.jpg";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

// Loose keyword → dish image mapping so a signature dish name resolves to a photo.
const IMAGE_KEYWORDS: Array<[RegExp, string]> = [
  [/thali|odisha/i, "dalma"],
  [/dalma/i, "dalma"],
  [/santula/i, "santula"],
  [/paneer|kadhi|bhurji/i, "chhena-poda"],
  [/aloo|baingan|baigan|poori|bhaja/i, "aloo-poori"],
  [/mushroom|soy|soybean|ghanta|mix ?veg|bhindi/i, "santula"],
  [/macha|fish/i, "macha-besara"],
  [/chicken|mutton|mansa/i, "chicken-jhola"],
  [/pakhala/i, "pakhala"],
  [/kheer/i, "kheeri"],
];

function pickImage(featured: string | null, dishes: string[], override: string | null): string {
  if (override) return override;
  const hay = `${featured ?? ""} ${dishes.join(" ")}`;
  for (const [re, key] of IMAGE_KEYWORDS) if (re.test(hay)) return imageForKey(key);
  return heroThali;
}

const MEAL_INCLUDES = [
  { icon: <Soup className="h-5 w-5" strokeWidth={1.5} />, title: "1 Serving Rice", note: "with Lunch" },
  { icon: <Wheat className="h-5 w-5" strokeWidth={1.5} />, title: "4 Fresh Rotis", note: "with Dinner" },
  { icon: <CookingPot className="h-5 w-5" strokeWidth={1.5} />, title: "Homestyle Dal", note: "Every meal" },
  { icon: <Utensils className="h-5 w-5" strokeWidth={1.5} />, title: "2 Seasonal Sabzis", note: "Fresh picks" },
  { icon: <Salad className="h-5 w-5" strokeWidth={1.5} />, title: "Fresh Salad", note: "Cut daily" },
  { icon: <Leaf className="h-5 w-5" strokeWidth={1.5} />, title: "Pickle", note: "House-made" },
];

type Plan = {
  key: "lunch" | "full" | "dinner";
  icon: React.ReactNode;
  title: string;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    key: "lunch",
    icon: <Sun className="h-5 w-5" strokeWidth={1.5} />,
    title: "Lunch Plan",
    price: 2600,
    tagline: "Monday – Saturday · 26 Meals",
    features: [
      "Fresh Homemade Lunch",
      "Rice / Roti",
      "Dal",
      "2 Seasonal Sabzis",
      "Salad & Pickle",
    ],
    cta: "Choose Lunch Plan",
  },
  {
    key: "full",
    icon: <Utensils className="h-5 w-5" strokeWidth={1.5} />,
    title: "Lunch + Dinner Plan",
    price: 4940,
    tagline: "Monday – Saturday · 26 Days",
    features: [
      "Lunch + Dinner Included",
      "Rotating Weekly Menu",
      "Fresh Homemade Food",
      "Balanced Nutrition",
      "Best Value",
    ],
    cta: "Choose Full Plan",
    highlight: true,
    badge: "Most Popular",
  },
  {
    key: "dinner",
    icon: <Moon className="h-5 w-5" strokeWidth={1.5} />,
    title: "Dinner Plan",
    price: 2600,
    tagline: "Monday – Saturday · 26 Meals",
    features: [
      "Fresh Homemade Dinner",
      "Roti / Rice",
      "Dal",
      "2 Seasonal Sabzis",
      "Salad & Pickle",
    ],
    cta: "Choose Dinner Plan",
  },
];

const DELIVERY_TIERS = [
  { label: "50+ Students", value: "Free Delivery" },
  { label: "25 – 49 Students", value: "₹150 / month" },
  { label: "10 – 24 Students", value: "₹250 / month" },
  { label: "5 – 9 Students", value: "₹350 / month" },
  { label: "Less than 5 Students", value: "Based on location" },
];

export function MealPlansSection() {
  return (
    <section
      id="meal-plans"
      className="relative border-t border-border/70 bg-gradient-to-b from-cream/40 via-background to-cream/30"
    >
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-clay">
            <span aria-hidden>🎓</span> For Students & Bachelors
          </span>
          <h2 className="mt-5 font-serif text-[2.1rem] leading-[1] tracking-tight text-ink md:text-[3rem]">
            Student Meal Plans
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground md:text-[15.5px]">
            Fresh, homemade meals delivered every day. Choose the plan that fits your lifestyle.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch md:gap-5 lg:gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>

        {/* Delivery info box */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-ink/10 bg-ink text-cream shadow-[0_30px_60px_-40px_rgba(30,20,15,0.4)]">
          <div className="grid gap-8 p-7 md:grid-cols-[auto_1fr] md:items-start md:gap-10 md:p-10">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-haldi/20 text-haldi">
                <Truck className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-haldi/80">
                  Delivery Charges
                </span>
                <h3 className="mt-1.5 font-serif text-2xl italic text-cream md:text-[1.75rem]">
                  Cheaper together.
                </h3>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-cream/65">
                  Charges depend on how many friends in your hostel or college subscribe with you.
                </p>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 md:gap-2.5">
              {DELIVERY_TIERS.map((tier) => (
                <li
                  key={tier.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3"
                >
                  <span className="text-[12.5px] text-cream/80">{tier.label}</span>
                  <span className="font-serif text-[14px] italic text-haldi">{tier.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Weekly menu */}
        <WeeklyMenu />
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const msg = `Hi! I'd like to subscribe to the ${plan.title} (${kitchen.currencySymbol}${plan.price}/month). Please share the details.`;
  const highlight = plan.highlight;
  return (
    <article
      className={`group relative flex flex-col rounded-3xl border p-7 transition-all duration-500 hover:-translate-y-1 md:p-8 ${
        highlight
          ? "border-clay/30 bg-gradient-to-b from-cream to-background shadow-[0_30px_70px_-30px_rgba(180,90,60,0.45)] md:-my-4 md:py-10"
          : "border-ink/10 bg-background/70 shadow-[0_20px_50px_-30px_rgba(30,20,15,0.25)] hover:border-ink/25"
      }`}
    >
      {highlight && plan.badge && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-clay px-3.5 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.24em] text-cream shadow-md shadow-clay/30">
          <Star className="h-3 w-3 fill-cream" strokeWidth={0} />
          {plan.badge}
        </span>
      )}

      <div className="flex items-center gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl ${
            highlight ? "bg-clay/15 text-clay" : "bg-haldi/25 text-ink"
          }`}
        >
          {plan.icon}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[1.35rem] leading-tight text-ink md:text-[1.5rem]">
            {plan.title}
          </h3>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {plan.tagline}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-serif text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
          {kitchen.currencySymbol}
        </span>
        <span className="font-serif text-[2.75rem] leading-none text-ink md:text-[3.25rem]">
          {plan.price.toLocaleString("en-IN")}
        </span>
        <span className="text-[12px] text-muted-foreground">/month</span>
      </div>

      <ul className="mt-6 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-ink/85">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-clay" : "text-leaf"}`}
              strokeWidth={2.2}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-dashed border-ink/10 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Delivery charges based on your hostel location.
      </div>

      <a
        href={whatsappUrl(msg)}
        target="_blank"
        rel="noreferrer"
        className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-300 hover:-translate-y-0.5 ${
          highlight
            ? "bg-clay text-cream shadow-lg shadow-clay/25 hover:bg-ink hover:shadow-ink/30"
            : "border border-ink/20 bg-background text-ink hover:border-clay hover:bg-ink hover:text-cream"
        }`}
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
        {plan.cta}
      </a>
    </article>
  );
}

function WeeklyMenu() {
  const { data = [], isLoading } = useQuery(weeklyMenuQueryOptions);
  const [openDay, setOpenDay] = useState(1); // mobile accordion — start with Monday open

  type Cell = { dishes: string[]; featured: string | null; image: string | null };
  const byDay = useMemo(() => {
    const empty = (): Cell => ({ dishes: [], featured: null, image: null });
    const map = new Map<number, { Lunch: Cell; Dinner: Cell }>();
    for (let d = 1; d <= 6; d++) map.set(d, { Lunch: empty(), Dinner: empty() });
    for (const row of data as WeeklyMenuRow[]) {
      const bucket = map.get(row.day);
      if (bucket) {
        bucket[row.meal] = {
          dishes: row.dishes ?? [],
          featured: row.featured_dish,
          image: row.image_url,
        };
      }
    }
    return map;
  }, [data]);

  return (
    <div className="mt-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-haldi/40 bg-haldi/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-ink">
          <Sparkles className="h-3 w-3" /> A Sample Week
        </span>
        <h3 className="mt-4 font-serif text-[1.75rem] leading-[1.05] tracking-tight text-ink md:text-[2.4rem]">
          A different plate,
          <span className="italic text-clay"> every single day.</span>
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground md:text-[14.5px]">
          Our menu rotates regularly, bringing you fresh homemade dishes through the week. Below is a sample of the kind of meals you can expect.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">Loading this week's menu…</div>
      ) : (
        <>
          {/* MOBILE: one accordion card per day. Tap to expand Lunch + Dinner. */}
          <div className="mt-10 space-y-3 md:hidden">
            {DAYS.map((short, i) => {
              const day = i + 1;
              const cells = byDay.get(day) ?? {
                Lunch: { dishes: [], featured: null, image: null },
                Dinner: { dishes: [], featured: null, image: null },
              };
              const isOpen = openDay === day;
              const heroCell = cells.Lunch.featured || cells.Lunch.dishes.length ? cells.Lunch : cells.Dinner;
              const heroImage = pickImage(heroCell.featured, heroCell.dishes, heroCell.image);
              const lunchTitle = cells.Lunch.featured ?? cells.Lunch.dishes[0] ?? "Chef's pick";
              return (
                <article
                  key={short}
                  className={`overflow-hidden rounded-2xl border bg-background transition-all ${
                    isOpen ? "border-clay/40 shadow-[0_24px_50px_-30px_rgba(180,90,60,0.4)]" : "border-ink/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDay(isOpen ? -1 : day)}
                    aria-expanded={isOpen}
                    className="flex w-full items-stretch gap-3 p-3 text-left"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                      <img
                        src={heroImage}
                        alt={`${DAY_FULL[i]} meal preview`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                          Day {day}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-clay/50" />
                        <span className="font-serif text-[13.5px] italic text-clay">{short}day</span>
                      </div>
                      <div className="mt-1 truncate font-serif text-[17px] text-ink">
                        {DAY_FULL[i]}
                      </div>
                      <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        Lunch · {lunchTitle}
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-clay transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.75}
                    />
                  </button>

                  {isOpen && (
                    <div className="grid gap-3 border-t border-dashed border-ink/10 p-3 pt-4">
                      <MealBlock meal="Lunch" cell={cells.Lunch} />
                      <MealBlock meal="Dinner" cell={cells.Dinner} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* DESKTOP: 3-col grid, all six days visible */}
          <div className="mt-10 hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {DAYS.map((short, i) => {
              const day = i + 1;
              const cells = byDay.get(day) ?? {
                Lunch: { dishes: [], featured: null, image: null },
                Dinner: { dishes: [], featured: null, image: null },
              };
              const heroCell = cells.Lunch.featured || cells.Lunch.dishes.length ? cells.Lunch : cells.Dinner;
              const heroImage = pickImage(heroCell.featured, heroCell.dishes, heroCell.image);
              return (
                <article
                  key={short}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-background shadow-[0_20px_50px_-38px_rgba(30,20,15,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-clay/30 hover:shadow-[0_28px_60px_-30px_rgba(180,90,60,0.3)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                    <img
                      src={heroImage}
                      alt={`${DAY_FULL[i]} meal`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.24em] text-ink backdrop-blur">
                      Day {day}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cream/75">
                        {short}day
                      </p>
                      <h4 className="mt-0.5 font-serif text-xl leading-tight text-cream">
                        {DAY_FULL[i]}
                      </h4>
                    </div>
                  </div>
                  <div className="grid flex-1 gap-3 p-4">
                    <MealBlock meal="Lunch" cell={cells.Lunch} />
                    <MealBlock meal="Dinner" cell={cells.Dinner} />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Rotation note */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-dashed border-clay/30 bg-clay/[0.04] px-5 py-4 md:items-center md:justify-center md:text-center">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clay/10 text-clay">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-clay">
                Menu rotates regularly
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground md:text-[13px]">
                The dishes shown are sample meals. Menu changes regularly based on seasonal vegetables, homemaker specialties, and ingredient availability.
              </p>
            </div>
          </div>

          {/* Meal includes strip */}
          <MealIncludesStrip />
        </>
      )}
    </div>
  );
}

function MealBlock({
  meal,
  cell,
}: {
  meal: "Lunch" | "Dinner";
  cell: { dishes: string[]; featured: string | null; image: string | null };
}) {
  const isLunch = meal === "Lunch";
  const title = cell.featured ?? cell.dishes[0] ?? "Chef's pick";
  const extras = cell.featured ? cell.dishes : cell.dishes.slice(1);
  return (
    <div
      className={`rounded-xl border p-3 ${
        isLunch ? "border-haldi/25 bg-haldi/[0.06]" : "border-clay/25 bg-clay/[0.05]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isLunch ? "bg-haldi/25 text-ink" : "bg-clay/20 text-clay"
          }`}
        >
          {isLunch ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.24em] ${
            isLunch ? "text-ink/80" : "text-clay"
          }`}
        >
          {meal}
        </span>
      </div>
      <p className="mt-1.5 font-serif text-[15px] leading-snug text-ink">{title}</p>
      {extras.length > 0 && (
        <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[11.5px] leading-tight text-muted-foreground">
          {extras.map((d, idx) => (
            <li key={d} className="flex items-center gap-1.5">
              {idx > 0 && <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />}
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MealIncludesStrip() {
  return (
    <div className="mt-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-leaf">
          <Check className="h-3 w-3" strokeWidth={2.5} /> Every Subscription Includes
        </span>
        <h4 className="mt-4 font-serif text-[1.4rem] leading-tight text-ink md:text-[1.75rem]">
          A complete, balanced plate — <span className="italic text-clay">every time.</span>
        </h4>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {MEAL_INCLUDES.map((it) => (
          <div
            key={it.title}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-background/70 px-3 py-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/30 hover:shadow-[0_18px_36px_-24px_rgba(180,90,60,0.35)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-haldi/20 text-ink transition-colors duration-300 group-hover:bg-clay/15 group-hover:text-clay">
              {it.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink">{it.title}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {it.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-dashed border-ink/15 bg-cream/40 px-4 py-2.5 text-center">
        <Plus className="h-3.5 w-3.5 text-clay" strokeWidth={2.5} />
        <p className="text-[12px] text-muted-foreground">
          <span className="font-semibold text-ink">Extra rotis available</span> — order additional rotis separately anytime.
        </p>
      </div>
    </div>
  );
}