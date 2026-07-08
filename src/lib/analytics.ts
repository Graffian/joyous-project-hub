export type Analytics = {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  avgOrderValue: number;
  revenueByDay: { date: string; revenue: number }[];
  popularDishes: { name: string; quantity: number }[];
  ordersByStatus: { status: string; count: number; fill: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-clay)",
  confirmed: "var(--color-haldi)",
  received: "var(--color-leaf)",
  preparing: "#a78bfa",
  out_for_delivery: "#60a5fa",
  completed: "var(--color-ink)",
  delivered: "var(--color-ink)",
  cancelled: "#f87171",
};

export function computeAnalytics(raw: never[]): Analytics {
  const orders = raw as {
    status: string;
    price: number;
    quantity: number;
    created_at: string;
    dish_name: string;
  }[];

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.price * o.quantity, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.price * o.quantity, 0);

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dayBuckets: Record<string, number> = {};
  for (const o of orders) {
    if (!o.created_at) continue;
    const d = o.created_at.slice(0, 10);
    if (d >= thirtyDaysAgo.toISOString().slice(0, 10)) {
      dayBuckets[d] = (dayBuckets[d] ?? 0) + o.price * o.quantity;
    }
  }
  const revenueByDay = Object.entries(dayBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  // Popular dishes
  const dishBuckets: Record<string, number> = {};
  for (const o of orders) {
    const name = o.dish_name || "Unknown";
    dishBuckets[name] = (dishBuckets[name] ?? 0) + (o.quantity ?? 1);
  }
  const popularDishes = Object.entries(dishBuckets)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  // Orders by status
  const statusBuckets: Record<string, number> = {};
  for (const o of orders) {
    const s = o.status || "unknown";
    statusBuckets[s] = (statusBuckets[s] ?? 0) + 1;
  }
  const ordersByStatus = Object.entries(statusBuckets)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({
      status,
      count,
      fill: STATUS_COLORS[status] ?? "var(--color-muted-foreground)",
    }));

  return {
    totalOrders,
    totalRevenue,
    todayOrders: todayOrders.length,
    todayRevenue,
    avgOrderValue,
    revenueByDay,
    popularDishes,
    ordersByStatus,
  };
}
