import { kitchen, whatsappUrl, WHATSAPP_NUMBER } from "@/lib/kitchen-config";

export type Meal = "Lunch" | "Snack" | "Dinner";

export type Dish = {
  id: string;
  key: string;
  name: string;
  desc: string;
  price: number;
  meal: Meal;
  veg: boolean;
  image: string;
  signature?: boolean;
  soldOut?: boolean;
};

export { kitchen, whatsappUrl, WHATSAPP_NUMBER };

