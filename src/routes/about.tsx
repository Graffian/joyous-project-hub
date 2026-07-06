import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import aboutIllustration from "@/assets/about-illustration.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${kitchen.brand.fullName}` },
      {
        name: "description",
        content: `Ghar ka swaad, made accessible again. ${kitchen.brand.fullName} connects home cooks with people who crave authentic, home-style ${kitchen.cuisine} meals.`,
      },
      { property: "og:title", content: `About — ${kitchen.brand.fullName}` },
      {
        property: "og:description",
        content: `Ghar ka swaad, made accessible again. Home-cooked ${kitchen.cuisine} meals from real home kitchens in ${kitchen.brand.location}.`,
      },
    ],
  }),
  component: AboutPage,
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-clay">
      {children}
    </span>
  );
}

function AboutPage() {
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
          <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.28em] text-clay">
            Our story
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] text-ink md:text-6xl">
            Ghar ka swaad,
            <span className="italic text-clay"> made accessible again.</span>
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.05fr] md:gap-16 md:px-8 md:py-24">
          <div className="flex flex-col justify-center">
            <div className="space-y-5 text-[14px] leading-[1.75] text-muted-foreground md:text-[15px]">
              <p>
                In every home, there is one dish that never came from a restaurant menu. It came from
                someone's mother, grandmother, neighbour, bua, mausi, or didi — cooked slowly,
                remembered deeply, and served with warmth.
              </p>
              <p>
                But today, most people are eating fast, packaged, outside food — not because they
                don't miss ghar ka khana, but because they don't have easy access to it. Our platform
                brings that access back.
              </p>
              <p>
                We connect local home cooks with people who crave clean, authentic, home-style meals.
                Every dish is prepared in small batches, with familiar ingredients, regional recipes,
                and the care of a real home kitchen.
              </p>
              <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-clay">
                    For customers
                  </span>
                  <p className="mt-1.5 text-[13px] leading-relaxed">
                    A way to eat better — clean, familiar, comforting food made by a real person in a
                    real kitchen.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-clay">
                    For home cooks
                  </span>
                  <p className="mt-1.5 text-[13px] leading-relaxed">
                    A way to turn everyday cooking into income, identity, and independence — on their
                    own terms.
                  </p>
                </div>
              </div>
              <p className="font-serif text-base italic text-ink/80">
                This is not just food delivery. This is ghar ka swaad, made accessible again.
              </p>
            </div>
          </div>

          <div className="relative anim-fade-in">
            <div className="overflow-hidden rounded-2xl border border-ink/5 shadow-[0_30px_80px_-40px_rgba(80,40,20,0.35)]">
              <img
                src={aboutIllustration}
                alt="A warm home kitchen with brass pots, fresh vegetables, and a home-cooked thali"
                width={1280}
                height={1024}
                loading="lazy"
                className="h-[320px] w-full object-cover md:h-[520px]"
              />
            </div>
            <div className="absolute -left-3 top-6 -rotate-2 rounded-full bg-haldi px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-ink shadow-md">
              The kitchen
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
