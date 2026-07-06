import dalma from "@/assets/dishes/dalma.jpg";
import santula from "@/assets/dishes/santula.jpg";
import machaBesara from "@/assets/dishes/macha-besara.jpg";
import alooPoori from "@/assets/dishes/aloo-poori.jpg";
import chickenJhola from "@/assets/dishes/chicken-jhola.jpg";
import chhenaPoda from "@/assets/dishes/chhena-poda.jpg";
import pakhala from "@/assets/dishes/pakhala.jpg";
import gupchup from "@/assets/dishes/gupchup.jpg";
import mudhiMansa from "@/assets/dishes/mudhi-mansa.jpg";
import kheeri from "@/assets/dishes/kheeri.jpg";
import fallback from "@/assets/hero-thali.jpg";

const map: Record<string, string> = {
  dalma,
  santula,
  "macha-besara": machaBesara,
  "aloo-poori": alooPoori,
  "chicken-jhola": chickenJhola,
  "chhena-poda": chhenaPoda,
  pakhala,
  gupchup,
  "mudhi-mansa": mudhiMansa,
  kheeri,
};

export function imageForKey(key: string): string {
  return map[key] ?? fallback;
}
