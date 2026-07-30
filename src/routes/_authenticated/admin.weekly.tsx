import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { weeklyMenuQueryOptions, type WeeklyMenuRow } from "@/lib/queries";
import { toast } from "sonner";
import { Loader2, Save, Pencil, Trash2, X, Check, Sun, Moon } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

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
type DraftCell = { dishes: string; featured: string; image: string | null };
const cellKey = (day: number, meal: Meal) => `${day}-${meal}`;

function AdminWeekly() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(weeklyMenuQueryOptions);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftCell>({
    dishes: "", featured: "", image: null,
  });

  function startEdit(day: number, meal: Meal) {
    const row = (data as WeeklyMenuRow[]).find((r) => r.day === day && r.meal === meal);
    setEditingKey(cellKey(day, meal));
    setEditDraft({
      dishes: (row?.dishes ?? []).join("\n"),
      featured: row?.featured_dish ?? "",
      image: row?.image_url ?? null,
    });
  }

  function cancelEdit() {
    setEditingKey(null);
  }

  const save = useMutation({
    mutationFn: async ({ day, meal, cell }: { day: number; meal: Meal; cell: DraftCell }) => {
      const dishes = cell.dishes
        .split("\n")
        .map((s) => s.replace(/^[•\-·]\s*/, "").trim())
        .filter(Boolean);
      const featured_dish = cell.featured.trim() || null;
      const image_url = cell.image?.trim() || null;
      const { error } = await supabase.from("weekly_menu").upsert(
        { day, meal, dishes, featured_dish, image_url } as never,
        { onConflict: "day,meal" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly_menu"] });
      toast.success("Saved");
      setEditingKey(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async ({ day, meal }: { day: number; meal: Meal }) => {
      const { error } = await supabase.from("weekly_menu").delete().eq("day", day).eq("meal", meal);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly_menu"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl text-ink">This Week's Menu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a <strong>featured dish</strong>, an optional image, and the full plate. Changes go live instantly.
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
                const row = (data as WeeklyMenuRow[]).find((r) => r.day === d.n && r.meal === meal);
                const isEditing = editingKey === k;

                if (isEditing) {
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
                            value={editDraft.featured}
                            onChange={(e) => setEditDraft({ ...editDraft, featured: e.target.value })}
                            placeholder="e.g. Dalma Day"
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                            Image <span className="text-muted-foreground/70">(optional)</span>
                          </label>
                          <ImageUpload
                            value={editDraft.image}
                            onChange={(v) => setEditDraft({ ...editDraft, image: v })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/70">
                            Full plate (one per line)
                          </label>
                          <textarea
                            value={editDraft.dishes}
                            onChange={(e) => setEditDraft({ ...editDraft, dishes: e.target.value })}
                            rows={5}
                            placeholder={"Rice\nDal Tadka\nAloo Baingan\nSalad & Pickle"}
                            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-ink"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          disabled={save.isPending}
                          onClick={() => save.mutate({ day: d.n, meal, cell: editDraft })}
                          className="inline-flex items-center gap-1 rounded-full bg-clay px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cream disabled:opacity-60"
                        >
                          {save.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={meal} className={`rounded-xl border p-4 ${meal === "Lunch" ? "border-haldi/25 bg-haldi/[0.06]" : "border-clay/25 bg-clay/[0.05]"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${meal === "Lunch" ? "bg-haldi/25 text-ink" : "bg-clay/20 text-clay"}`}>
                          {meal === "Lunch" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.24em] ${meal === "Lunch" ? "text-ink/80" : "text-clay"}`}>
                          {meal}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => startEdit(d.n, meal)}
                          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-muted/40"
                        >
                          <Pencil className="h-2.5 w-2.5" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Clear ${DAYS[d.n - 1].label} ${meal}?`)) {
                              remove.mutate({ day: d.n, meal });
                            }
                          }}
                          disabled={remove.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 disabled:opacity-50"
                        >
                          <Trash2 className="h-2.5 w-2.5" /> Clear
                        </button>
                      </div>
                    </div>

                    {row ? (
                      <div className="mt-3">
                        {row.image_url && (
                          <div className="mb-2 h-20 w-full overflow-hidden rounded-lg border border-border/60 bg-cream">
                            <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <p className="font-serif text-[15px] leading-snug text-ink">
                          {row.featured_dish ?? row.dishes[0] ?? "Chef's pick"}
                        </p>
                        {row.dishes.length > 0 && (
                          <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[11.5px] leading-tight text-muted-foreground">
                            {(row.featured_dish ? row.dishes : row.dishes.slice(1)).map((d, idx) => (
                              <li key={d} className="flex items-center gap-1.5">
                                {idx > 0 && <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50" />}
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs italic text-muted-foreground/60">No menu set</p>
                    )}
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
