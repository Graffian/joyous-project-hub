import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

  const byDay = useMemo(() => {
    const map = new Map<number, { Lunch: string[]; Dinner: string[] }>();
    for (let d = 1; d <= 6; d++) map.set(d, { Lunch: [], Dinner: [] });
    for (const row of data as WeeklyMenuRow[]) {
      const bucket = map.get(row.day);
      if (bucket) bucket[row.meal] = row.dishes ?? [];
    }
    return map;
  }, [data]);

  return (
    <div className="mt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-haldi/40 bg-haldi/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-ink">
          <span aria-hidden>🍽</span> This Week's Menu
        </span>
        <h3 className="mt-4 font-serif text-[1.75rem] leading-[1.05] tracking-tight text-ink md:text-[2.4rem]">
          A different plate,
          <span className="italic text-clay"> every single day.</span>
        </h3>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
          Rotating home-style dishes cooked fresh, Monday through Saturday.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-10 text-center text-sm text-muted-foreground">Loading this week's menu…</div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DAYS.map((label, i) => {
            const day = i + 1;
            const b = byDay.get(day)!;
            return (
              <article
                key={label}
                className="group rounded-2xl border border-ink/10 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-[0_20px_40px_-24px_rgba(180,90,60,0.35)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-xl italic text-clay">{label}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                    {DAY_FULL[i]}
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  <MealBlock icon={<Sun className="h-3.5 w-3.5" />} label="Lunch" items={b.Lunch} />
                  <div className="h-px bg-ink/[0.06]" />
                  <MealBlock icon={<Moon className="h-3.5 w-3.5" />} label="Dinner" items={b.Dinner} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        Menu subject to seasonal availability
      </p>
    </div>
  );
}

function MealBlock({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-ink">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-haldi/25 text-ink">
          {icon}
        </span>
        {label}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[12.5px] italic text-muted-foreground/70">To be announced</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((d) => (
            <li key={d} className="text-[13px] leading-snug text-ink/80">
              · {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}