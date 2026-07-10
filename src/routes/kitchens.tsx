import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/kitchens")({
  head: () => ({
    meta: [
      { title: `Cook with ${kitchen.brand.fullName} — Home Kitchen Opportunity` },
      {
        name: "description",
        content: `Turn your home kitchen into an income. Cook your way, list your dishes, and earn with ${kitchen.brand.fullName}.`,
      },
      { property: "og:title", content: `Cook with ${kitchen.brand.fullName}` },
      {
        property: "og:description",
        content: `Homemakers and aspiring chefs: cook from home and earn. Join us in ${kitchen.brand.location}.`,
      },
    ],
  }),
  component: KitchensPage,
});

function KitchensPage() {
  return (
    <div className="min-h-screen bg-background text-foreground paper-grain">
      <SiteHeader />

      {/* Hero Section */}
      <section className="border-b border-border/70 bg-gradient-to-b from-background to-background/50">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-clay">
              Cook with us
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-ink md:text-5xl">
              Turn your home kitchen
              <span className="italic text-clay"> into income</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Cook your favorite dishes from home. List a few chosen plates. We handle the orders, delivery, and customers — you handle the flavor.
            </p>
            <Link
              to="/kitchens/apply"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
            >
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <h2 className="font-serif text-3xl leading-[1.05] text-ink md:text-4xl">
            Why cook with us?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Your own kitchen",
                description:
                  "Cook from home in your own space, on your own schedule. No shared facilities or commute.",
              },
              {
                title: "Choose your dishes",
                description:
                  "List the dishes you love to cook. We promote them to customers who are looking for exactly what you make.",
              },
              {
                title: "Reliable income",
                description:
                  "Get paid for every dish ordered. No subscription fees or hidden charges — just fair earnings for your work.",
              },
              {
                title: "We handle logistics",
                description:
                  "We manage orders, payments, and delivery. You focus on cooking great food.",
              },
              {
                title: "Flexible timing",
                description:
                  "Set your own meal timings and availability. Work as much or as little as you want.",
              },
              {
                title: "Grow your reputation",
                description:
                  "Build a loyal customer base. Customers see your name and reviews on every order.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/40 bg-background/50 p-6 backdrop-blur-sm md:p-8"
              >
                <h3 className="font-serif text-lg text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <h2 className="font-serif text-3xl leading-[1.05] text-ink md:text-4xl">
            How it works
          </h2>
          <div className="mt-12 space-y-8">
            {[
              {
                step: "01",
                title: "Apply & get verified",
                description:
                  "Submit your application with some details about you and the dishes you cook. We'll review and reach out for a quick kitchen visit.",
              },
              {
                step: "02",
                title: "Set up your dishes",
                description:
                  "Once approved, list the dishes you want to cook. Add photos, descriptions, and prices. You're in control.",
              },
              {
                step: "03",
                title: "Start receiving orders",
                description:
                  "Customers discover and order your dishes. You cook and prepare them. We handle delivery and payment processing.",
              },
              {
                step: "04",
                title: "Grow your kitchen",
                description:
                  "Build repeat customers, earn reviews, and grow your income. Scale at your own pace.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="shrink-0">
                  <span className="font-serif text-3xl italic text-clay">{item.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border/70 bg-gradient-to-b from-background to-background/50">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="rounded-3xl border border-border/40 bg-ink/5 p-8 text-center md:p-12">
            <h2 className="font-serif text-3xl leading-[1.05] text-ink md:text-4xl">
              Ready to start cooking?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Join home chefs in {kitchen.brand.location} who are already earning through their passion for cooking.
            </p>
            <Link
              to="/kitchens/apply"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
            >
              Apply now <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-6 text-xs text-muted-foreground">
              Takes about 5 minutes. We'll review and reach out on WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
