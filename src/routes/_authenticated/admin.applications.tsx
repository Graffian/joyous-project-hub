import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminApplicationsQueryOptions } from "@/lib/queries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AdminApplications,
});

const STATUSES = ["new", "reviewing", "accepted", "declined"] as const;

function AdminApplications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(adminApplicationsQueryOptions);
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: (typeof STATUSES)[number] }) => {
      const { error } = await supabase.from("cook_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cook_applications"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Cook applications</h1>
      <p className="mt-1 text-sm text-muted-foreground">Home kitchens who want to join.</p>
      <div className="mt-8 grid gap-4">
        {data?.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="font-serif text-xl text-ink">{a.name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.phone} · {a.area} · {new Date(a.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
              <select
                defaultValue={a.status}
                onChange={(e) => update.mutate({ id: a.id, status: e.target.value as (typeof STATUSES)[number] })}
                className="rounded border border-input bg-background px-2 py-1 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 text-sm text-foreground">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Dishes
              </span>
              <div className="mt-1">{a.dishes}</div>
            </div>
            {a.experience && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em]">About</span>
                <div className="mt-1 whitespace-pre-line">{a.experience}</div>
              </div>
            )}
          </div>
        ))}
        {data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No applications yet.
          </div>
        )}
      </div>
    </div>
  );
}
