import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminOrdersQueryOptions } from "@/lib/queries";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { kitchen } from "@/lib/kitchen-config";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const WORKFLOW = [
  { key: "received", label: "Received", stamp: "received_at" },
  { key: "preparing", label: "Preparing", stamp: "preparing_at" },
  { key: "out_for_delivery", label: "Out for delivery", stamp: "out_for_delivery_at" },
  { key: "completed", label: "Completed", stamp: "completed_at" },
] as const;

type WorkflowStatus = (typeof WORKFLOW)[number]["key"];
const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  received: 0,
  confirmed: 1,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
  completed: 3,
};

function fmt(ts?: string | null) {
  if (!ts) return null;
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(adminOrdersQueryOptions);
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WorkflowStatus | "cancelled" }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Latest 200 orders. Advance the workflow as each stage happens — timestamps are saved automatically.
      </p>

      <div className="mt-8 space-y-4">
        {data?.map((o) => {
          const stamps: Record<string, string | null> = {
            received_at: (o as { received_at?: string | null }).received_at ?? o.created_at,
            preparing_at: (o as { preparing_at?: string | null }).preparing_at ?? null,
            out_for_delivery_at: (o as { out_for_delivery_at?: string | null }).out_for_delivery_at ?? null,
            completed_at: (o as { completed_at?: string | null }).completed_at ?? null,
          };
          const cancelledAt = (o as { cancelled_at?: string | null }).cancelled_at ?? null;
          const isCancelled = o.status === "cancelled";
          const currentIdx = STATUS_INDEX[o.status] ?? 0;

          return (
            <div key={o.id} className="rounded-xl border border-border bg-card p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.code}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-ink">
                    {o.dish_name} <span className="text-muted-foreground">× {o.quantity}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {kitchen.currencySymbol}
                      {o.price * o.quantity}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.phone} · {o.address}</div>
                  {o.slot && <div className="text-xs text-muted-foreground">Slot: {o.slot}</div>}
                  {o.notes && <div className="mt-1 text-xs italic text-muted-foreground">"{o.notes}"</div>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isCancelled ? (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                      Cancelled {fmt(cancelledAt) && `· ${fmt(cancelledAt)}`}
                    </span>
                  ) : (
                    <button
                      onClick={() => update.mutate({ id: o.id, status: "cancelled" })}
                      className="text-xs text-muted-foreground underline hover:text-destructive"
                    >
                      Cancel order
                    </button>
                  )}
                </div>
              </div>

              {!isCancelled && (
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {WORKFLOW.map((step, idx) => {
                    const done = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const stamp = fmt(stamps[step.stamp]);
                    const canAdvance = idx > currentIdx;
                    return (
                      <button
                        key={step.key}
                        disabled={!canAdvance || update.isPending}
                        onClick={() => update.mutate({ id: o.id, status: step.key })}
                        className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                          done
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-background hover:bg-muted/40"
                        } ${canAdvance ? "cursor-pointer" : "cursor-default"} disabled:opacity-100`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={isCurrent ? "text-ink" : done ? "text-primary" : "text-muted-foreground"}>
                            {step.label}
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {stamp ?? (canAdvance ? "Tap to advance" : "—")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {data?.length === 0 && (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  );
}
