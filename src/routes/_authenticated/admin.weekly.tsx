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
type DraftMap = Record<string, string>;
const cellKey = (day: number, meal: Meal) => `${day}-${meal}`;

function AdminWeekly() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(weeklyMenuQueryOptions);
  const [draft, setDraft] = useState<DraftMap>({});

  useEffect(() => {
    const next: DraftMap = {};
    for (const row of data as WeeklyMenuRow[]) {
      next[cellKey(row.day, row.meal)] = (row.dishes ?? []).join("\n");
    }
    // Ensure all cells exist
    for (const d of DAYS) {
      for (const m of ["Lunch", "Dinner"] as const) {
        const k = cellKey(d.n, m);
        if (!(k in next)) next[k] = "";
      }
    }
    setDraft(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async ({ day, meal, text }: { day: number; meal: Meal; text: string }) => {
      const dishes = text
        .split("\n")
        .map((s) => s.replace(/^[•\-·]\s*/, "").trim())
        .filter(Boolean);
      const { error } = await supabase
        .from("weekly_menu")
        .upsert({ day, meal, dishes } as never, { onConflict: "day,meal" });
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
          Write one dish per line. Changes go live on the homepage instantly.
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
                return (
                  <div key={meal}>
                    <label className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      {meal}
                    </label>
                    <textarea
                      value={draft[k] ?? ""}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [k]: e.target.value }))}
                      rows={5}
                      placeholder={"Dish 1\nDish 2\nDish 3"}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        disabled={save.isPending}
                        onClick={() =>
                          save.mutate({ day: d.n, meal, text: draft[k] ?? "" })
                        }
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