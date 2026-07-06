import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminMenuQueryOptions } from "@/lib/queries";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: AdminMenu,
});

type MenuRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  meal: "Lunch" | "Snack" | "Dinner";
  veg: boolean;
  signature: boolean;
  sold_out: boolean;
  active: boolean;
  sort_order: number;
};

const MEALS = ["Lunch", "Snack", "Dinner"] as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function AdminMenu() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(adminMenuQueryOptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<MenuRow>>({});
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState<Partial<MenuRow>>({
    name: "",
    description: "",
    price: 0,
    meal: "Lunch",
    veg: true,
    signature: false,
    sold_out: false,
    active: true,
    sort_order: 100,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("menu_items").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async (row: Partial<MenuRow>) => {
      if (!row.name?.trim()) throw new Error("Name is required");
      const key = slugify(row.name);
      if (!key) throw new Error("Invalid name");
      const { error } = await supabase.from("menu_items").insert({
        key,
        name: row.name.trim(),
        description: row.description?.trim() ?? "",
        price: Number(row.price ?? 0),
        meal: row.meal ?? "Lunch",
        veg: !!row.veg,
        signature: !!row.signature,
        sold_out: !!row.sold_out,
        active: row.active ?? true,
        sort_order: Number(row.sort_order ?? 100),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Dish added");
      setCreating(false);
      setNewRow({
        name: "",
        description: "",
        price: 0,
        meal: "Lunch",
        veg: true,
        signature: false,
        sold_out: false,
        active: true,
        sort_order: 100,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(row: MenuRow) {
    setEditingId(row.id);
    setDraft({
      name: row.name,
      description: row.description,
      price: row.price,
      meal: row.meal,
      veg: row.veg,
      sort_order: row.sort_order,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  function saveEdit(id: string) {
    update.mutate(
      { id, patch: draft as Record<string, unknown> },
      { onSuccess: () => cancelEdit() },
    );
  }

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  const currency = kitchen.currencySymbol;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Today's menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit dishes, prices, and availability. Changes go live instantly.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cream"
        >
          {creating ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {creating ? "Cancel" : "Add dish"}
        </button>
      </div>

      {creating && (
        <div className="mt-6 rounded-xl border border-border bg-cream/40 p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">New dish</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-muted-foreground">
              Name
              <input
                value={newRow.name ?? ""}
                onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-ink"
                placeholder="Dalma"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Price ({currency})
              <input
                type="number"
                min={0}
                value={newRow.price ?? 0}
                onChange={(e) => setNewRow({ ...newRow, price: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-muted-foreground md:col-span-2">
              Description
              <textarea
                value={newRow.description ?? ""}
                onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-ink"
                rows={2}
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Meal
              <select
                value={newRow.meal ?? "Lunch"}
                onChange={(e) => setNewRow({ ...newRow, meal: e.target.value as MenuRow["meal"] })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-ink"
              >
                {MEALS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Sort order
              <input
                type="number"
                value={newRow.sort_order ?? 100}
                onChange={(e) => setNewRow({ ...newRow, sort_order: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink md:col-span-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!newRow.veg}
                  onChange={(e) => setNewRow({ ...newRow, veg: e.target.checked })}
                />
                Veg
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!newRow.signature}
                  onChange={(e) => setNewRow({ ...newRow, signature: e.target.checked })}
                />
                Signature
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRow.active ?? true}
                  onChange={(e) => setNewRow({ ...newRow, active: e.target.checked })}
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={create.isPending}
              onClick={() => create.mutate(newRow)}
              className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cream disabled:opacity-60"
            >
              {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save dish
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/40 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <tr>
              <th className="p-3">Dish</th>
              <th className="p-3">Meal</th>
              <th className="p-3">Price</th>
              <th className="p-3">Veg</th>
              <th className="p-3">Signature</th>
              <th className="p-3">Sold out</th>
              <th className="p-3">Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data as MenuRow[] | undefined)?.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={draft.name ?? ""}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-ink"
                        />
                        <textarea
                          value={draft.description ?? ""}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-ink"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-ink">{row.name}</div>
                        <div className="mt-0.5 max-w-sm text-xs text-muted-foreground">{row.description}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                          {row.key}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <select
                        value={draft.meal ?? row.meal}
                        onChange={(e) => setDraft({ ...draft, meal: e.target.value as MenuRow["meal"] })}
                        className="rounded border border-input bg-background px-2 py-1 text-sm"
                      >
                        {MEALS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      row.meal
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={draft.price ?? row.price}
                        onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                        className="w-24 rounded border border-input bg-background px-2 py-1 text-sm"
                      />
                    ) : (
                      <input
                        type="number"
                        defaultValue={row.price}
                        min={0}
                        className="w-24 rounded border border-input bg-background px-2 py-1 text-sm"
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v !== row.price) update.mutate({ id: row.id, patch: { price: v } });
                        }}
                      />
                    )}
                  </td>
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={draft.veg ?? row.veg}
                        onChange={(e) => setDraft({ ...draft, veg: e.target.checked })}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        defaultChecked={row.veg}
                        onChange={(e) => update.mutate({ id: row.id, patch: { veg: e.target.checked } })}
                      />
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      defaultChecked={row.signature}
                      onChange={(e) => update.mutate({ id: row.id, patch: { signature: e.target.checked } })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      defaultChecked={row.sold_out}
                      onChange={(e) => update.mutate({ id: row.id, patch: { sold_out: e.target.checked } })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      defaultChecked={row.active}
                      onChange={(e) => update.mutate({ id: row.id, patch: { active: e.target.checked } })}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(row.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-clay px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cream"
                          >
                            <Check className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(row)}
                            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${row.name}"? This cannot be undone.`)) {
                                remove.mutate(row.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
