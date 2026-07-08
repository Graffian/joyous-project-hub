import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { analyticsQueryOptions } from "@/lib/queries";
import { kitchen } from "@/lib/kitchen-config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

const currency = kitchen.currencySymbol;

function AdminAnalytics() {
  const { data, isLoading } = useQuery(analyticsQueryOptions);

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
        No data yet.
      </div>
    );
  }

  const formatCurrency = (v: number) => `${currency}${v.toLocaleString("en-IN")}`;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Orders, revenue, and popular dishes at a glance.
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Orders" value={data.totalOrders.toLocaleString("en-IN")} />
        <KpiCard title="Total Revenue" value={formatCurrency(data.totalRevenue)} />
        <KpiCard title="Today's Orders" value={data.todayOrders.toLocaleString("en-IN")} />
        <KpiCard title="Avg Order Value" value={formatCurrency(data.avgOrderValue)} />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue over time */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Revenue (Last 30 Days)
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(18, 50%, 47%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(18, 50%, 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  stroke="hsl(30, 10%, 60%)"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(30, 10%, 60%)" />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(30, 15%, 85%)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(18, 50%, 47%)"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Orders by Status
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {data.ordersByStatus.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(30, 15%, 85%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {data.ordersByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                {s.status.replace(/_/g, " ")}: {s.count}
              </div>
            ))}
          </div>
        </div>

        {/* Popular dishes */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Popular Dishes
          </h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.popularDishes}
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(30, 10%, 60%)" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(30, 10%, 60%)"
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(30, 15%, 85%)",
                  }}
                  formatter={(value: number) => [value, "Orders"]}
                />
                <Bar dataKey="quantity" fill="hsl(18, 50%, 47%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      <div className="mt-1.5 font-serif text-2xl text-ink">{value}</div>
    </div>
  );
}
