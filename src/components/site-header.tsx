import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { whatsappUrl } from "@/lib/menu";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { kitchen } from "@/lib/kitchen-config";
import logoUrl from "@/assets/rasoori-logo.webp";

const nav = [
  { label: "Today's Menu", href: "/", hash: "menu" },
  { label: "How it Works", href: "/", hash: "how" },
  { label: "Our Cook", href: "/", hash: "cook" },
  { label: "Kitchens", href: "/kitchens/apply" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? "bg-background/85 backdrop-blur border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8 md:py-4">
        <Link to="/" className="group -my-2 flex shrink-0 items-center" aria-label={kitchen.brand.fullName}>
          <img
            src={logoUrl}
            alt={kitchen.brand.fullName}
            width={72}
            height={72}
            fetchPriority="high"
            decoding="async"
            className="h-16 w-auto md:h-20"
          />
        </Link>


        <nav className="hidden items-center gap-9 md:flex">
          {nav.map((n) =>
            n.hash ? (
              <Link
                key={n.label}
                to="/"
                hash={n.hash}
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:text-clay"
              >
                {n.label}
              </Link>
            ) : (
              <Link
                key={n.label}
                to={n.href}
                className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/70 transition-colors hover:text-clay"
              >
                {n.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAdmin && (
            <Link
              to="/admin"
              className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
            >
              Admin
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground hover:text-clay"
          >
            {user ? "Account" : "Sign in"}
          </Link>
          <CartButton count={count} onClick={openCart} />
          <a
            href={whatsappUrl("Hi! I'd like to place an order from today's menu.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cream transition-all hover:-translate-y-0.5 hover:bg-clay"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Order on WhatsApp
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartButton count={count} onClick={openCart} />
          <button
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-ink"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {nav.map((n) =>
              n.hash ? (
                <Link
                  key={n.label}
                  to="/"
                  hash={n.hash}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm text-foreground"
                >
                  {n.label}
                </Link>
              ) : (
                <Link
                  key={n.label}
                  to={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm text-foreground"
                >
                  {n.label}
                </Link>
              ),
            )}
            <a
              href={whatsappUrl("Hi! I'd like to place an order from today's menu.")}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Order on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function CartButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open cart (${count} items)`}
      className="relative inline-flex items-center justify-center rounded-full border border-ink/15 bg-background p-2.5 text-ink transition-colors hover:border-ink/40 hover:text-clay"
    >
      <ShoppingBag className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[9px] font-bold text-cream">
          {count}
        </span>
      )}
    </button>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.174.199-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.746.457 3.45 1.324 4.949L2 22l5.29-1.388a9.87 9.87 0 0 0 4.74 1.207h.004c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z" />
    </svg>
  );
}
