import { Link } from "@tanstack/react-router";
import { kitchen } from "@/lib/kitchen-config";
import logoAsset from "@/assets/rasoori-logo.webp.asset.json";
import logoAsset2x from "@/assets/rasoori-logo@2x.webp.asset.json";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <div className="flex items-center gap-1.5">
            <img
              src={logoAsset.url}
              srcSet={`${logoAsset.url} 1x, ${logoAsset2x.url} 2x`}
              alt={kitchen.brand.fullName}
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto"
            />
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Ghar ka khana, cooked by hand and delivered across {kitchen.brand.location}. Made with love in {kitchen.contact.state}.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-serif text-base text-ink">Reach us</h4>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>WhatsApp · {kitchen.whatsapp.display}</li>
            <li>{kitchen.contact.address}</li>
            <li>{kitchen.contact.orderHours}</li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-serif text-base text-ink">More</h4>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/kitchens/apply" className="hover:text-clay">
                Cook with us
              </Link>
            </li>
            <li>Delivery zones · {kitchen.delivery.extendedZones}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:px-8">
          <span>© {new Date().getFullYear()} {kitchen.brand.fullName}</span>
          <span>Made in {kitchen.brand.location}, {kitchen.contact.state}</span>
        </div>
      </div>
    </footer>
  );
}
