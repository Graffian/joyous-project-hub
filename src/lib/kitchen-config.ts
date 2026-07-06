export const kitchen = {
  brand: {
    name: "Rasoori",
    location: "Rourkela",
    fullName: "Rasoori Rourkela",
    tagline: "Homemade meals, delivered from a home kitchen",
  },

  description:
    "Ghar ka khana delivered across Rourkela. Ten dishes a day, cooked by hand in a home kitchen. Order on WhatsApp.",

  whatsapp: {
    number: "919938142066", // digits only, with country code
    display: "+91 99381 42066",
  },

  contact: {
    address: "Sector 2, Rourkela, Odisha",
    city: "Rourkela",
    state: "Odisha",
    orderHours: "Orders daily · 9am to 8pm",
  },

  cuisine: "Odia",
  currency: "INR",
  currencySymbol: "₹",

  timing: {
    lunchBy: "12:30 pm",
    dinnerBy: "8:00 pm",
    lunchOrderTime: "11:00",
    dinnerOrderTime: "18:30",
  },

  delivery: {
    zones: "Sector 1–20",
    extendedZones: "Sector 1–20, Chhend, Basanti Colony",
  },

  signature: {
    dish: "Odia Dalma",
    price: 120,
    with: "steamed rice",
  },

  cook: {
    name: "Meena",
    note: "For twenty years I've cooked for my family in this same kitchen. When my children moved away, the kitchen stayed full — and so did my heart. Every dish on the board is a recipe I actually make at home. If it isn't up to the mark, it doesn't leave the kitchen.",
  },

  meta: {
    ogImage:
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8a705965-fc8c-46a5-bbdc-6dd919702c92/id-preview-074c6604--dbfe180a-84ed-48d7-a4bd-338e1523a907.lovable.app-1783103305677.png",
  },
} as const;

export const WHATSAPP_NUMBER = kitchen.whatsapp.number;

export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
