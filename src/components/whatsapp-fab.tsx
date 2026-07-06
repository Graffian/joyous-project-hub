import { whatsappUrl } from "@/lib/menu";
import { kitchen } from "@/lib/kitchen-config";
import { WhatsAppIcon } from "./site-header";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl(`Hi ${kitchen.brand.fullName}! I'd like to place an order.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/15 transition-transform hover:-translate-y-0.5 md:hidden"
    >
      <WhatsAppIcon className="h-5 w-5" />
      Order
    </a>
  );
}
