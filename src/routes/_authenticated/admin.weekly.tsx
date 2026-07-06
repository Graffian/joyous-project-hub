import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { weeklyMenuQueryOptions, type WeeklyMenuRow } from "@/lib/queries";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/weekly")({
  component: AdminWeekly,
});

const DAYS = [
  { n: 1, label: "Monday" },
  { n: 2, label: "Tuesday" },
  { n: 3, label: "Wednesday" },
  { n: 4, label: "Thursday" },
  { n: 5, label: "Friday" },
  { n: 6, label: "Saturday" },
] as const;

type Meal = "Lunch" | "Dinner";
type DraftCell = { dishes: string; featured: string; image: string };
type DraftMap = Record<string, DraftCell>;
const cellKey = (day: number, meal: Meal) => `${day}-${meal}`;
const emptyCell = (): DraftCell => ({ dishes: "", featured: "", image: "" });

function AdminWeekly() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(weeklyMenuQueryOptions);
  const [draft, setDraft] = useState<DraftMap>({});

  useEffect(() => {
    const next: DraftMap = {};
    for (const row of data as WeeklyMenuRow[]) {
      next[cellKey(row.day, row.meal)] = {
        dishes: (row.dishes ?? []).join("\n"),
        featured: row.featured_dish ?? "",
        image: row.image_url ?? "",
      };
    }
    // Ensure all cells exist
    for (const d of DAYS) {
      for (const m of ["Lunch", "Dinner"] as const) {
        const k = cellKey(d.n, m);
        if (!(k in next)) next[k] = emptyCell();
      }
    }
    setDraft(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async ({
      day,
      meal,
      cell,
    }: {
      day: number;
      meal: Meal;
      cell: DraftCell;
    }) => {
      const dishes = cell.dishes
        .split("\n")
        .map((s) => s.replace(/^[•\-·]\s*/, "").trim())
        .filter(Boolean);
      const featured_dish = cell.featured.trim() || null;
      const image_url = cell.image.trim() || null;
      const { error } = await supabase
        .from("weekly_menu")
        .upsert(
          { day, meal, dishes, featured_dish, image_url } as never,
          { onConflict: "day,meal" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly_menu"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-ink">This Week's Menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a <strong>featured dish</strong> (e.g. "Dalma Day"), an optional image URL, and the full plate — one dish per line. Changes go live on the homepage instantly.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {DAYS.map((d) => (
          <div key={d.n} className="rounded-2xl border border-border bg-cream/40 p-5 md:p-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-xl italic text-clay">{d.label}</h2>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Day {d.n}
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(["Lunch", "Dinner"] as const).map((meal) => {
                const k = cellKey(d.n, meal);
                const cell = draft[k] ?? emptyCell();
                const update = (patch: Partial<DraftCell>) =>
                  setDraft((prev) => ({ ...prev, [k]: { ...(prev[k] ?? emptyCell()), ...patch } }));
                return (
                  <div key={meal} className="rounded-xl border border-border bg-background/60 p-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      {meal}
                    </label>

                    <div className="mt-3 grid gap-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                          Featured dish
                        </label>
                        <input
                          type="text"
                          value={cell.featured}
                          onChange={(e) => update({ featured: e.target.value })}
                          placeholder="e.g. Dalma Day"
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                          Image URL <span className="text-muted-foreground/70">(optional)</span>
                        </label>
                        <input
                          type="url"
                          value={cell.image}
                          onChange={(e) => update({ image: e.target.value })}
                          placeholder="https://…"
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                          Full plate (one per line)
                        </label>
                        <textarea
                          value={cell.dishes}
                          onChange={(e) => update({ dishes: e.target.value })}
                          rows={5}
                          placeholder={"Rice\nDal Tadka\nAloo Baingan\nSalad & Pickle"}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        disabled={save.isPending}
                        onClick={() => save.mutate({ day: d.n, meal, cell })}
                        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-cream disabled:opacity-60"
                      >
                        {save.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save {meal}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}