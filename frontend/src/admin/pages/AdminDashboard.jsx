import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { formatCurrency } from "../../utils/money";

const apiUrl =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const emptyStats = {
  totals: {
    orders: 0,
    users: 0,
    activeUsers: 0,
    pizzas: 0,
    availablePizzas: 0,
    toppings: 0,
    paidOrders: 0,
    codOrders: 0,
    pendingPayments: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  },

  money: {
    grossRevenue: 0,
    revenue: 0,
    netRevenue: 0,
    netWorth: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
  },

  performance: {
    conversionRate: 0,
    fulfillmentRate: 0,
    cancellationRate: 0,
  },

  breakdowns: {
    orderStatus: {},
    paymentStatus: {},
  },

  recentOrders: [],
  topPizzas: [],
  revenueSeries: [],

  razorpay: {
    mode: "not_configured",
    detectedMode: "not_configured",
    isConfigured: false,
    isLive: false,
    keyPrefix: "missing",
  },
};

const normalizeStats = (payload) => {
  const data = payload?.data || payload || {};

  return {
    ...emptyStats,

    totals: {
      ...emptyStats.totals,
      ...(data.totals || {}),
    },

    money: {
      ...emptyStats.money,
      ...(data.money || {}),
    },

    performance: {
      ...emptyStats.performance,
      ...(data.performance || {}),
    },

    breakdowns: {
      ...emptyStats.breakdowns,
      ...(data.breakdowns || {}),
    },

    recentOrders: data.recentOrders || [],

    topPizzas: data.topPizzas || [],

    revenueSeries: data.revenueSeries || [],

    razorpay: {
      ...emptyStats.razorpay,
      ...(data.razorpay || {}),
    },
  };
};

const startOfDay = () => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
};

const startOfMonth = () => {
  const date = new Date();

  date.setDate(1);

  date.setHours(0, 0, 0, 0);

  return date;
};

const buildFallbackStats = ({
  orders = [],
  users = [],
  pizzas = [],
  toppings = [],
  razorpay = {},
}) => {
  const paidOrders = orders.filter((order) =>
    ["paid", "cod"].includes(order.paymentStatus)
  );

  const today = startOfDay();

  const month = startOfMonth();

  const grossRevenue = paidOrders.reduce(
    (sum, order) =>
      sum + (Number(order.totalAmount) || 0),
    0
  );

  const todayRevenue = paidOrders
    .filter(
      (order) =>
        new Date(order.createdAt) >= today
    )
    .reduce(
      (sum, order) =>
        sum + (Number(order.totalAmount) || 0),
      0
    );

  const monthlyRevenue = paidOrders
    .filter(
      (order) =>
        new Date(order.createdAt) >= month
    )
    .reduce(
      (sum, order) =>
        sum + (Number(order.totalAmount) || 0),
      0
    );

  const deliveredOrders = orders.filter(
    (order) =>
      order.orderStatus === "delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      order.orderStatus === "cancelled"
  ).length;

  const topPizzaMap = paidOrders.reduce(
    (acc, order) => {
      (order.items || []).forEach((item) => {
        const key = item.name || "Pizza";

        if (!acc[key]) {
          acc[key] = {
            _id: key,
            quantity: 0,
            revenue: 0,
          };
        }

        acc[key].quantity +=
          Number(item.qty) || 0;

        acc[key].revenue +=
          (Number(item.price) || 0) *
          (Number(item.qty) || 0);
      });

      return acc;
    },
    {}
  );

  return normalizeStats({
    totals: {
      orders: orders.length,

      users: users.length,

      activeUsers: users.filter(
        (user) => user.status !== "inactive"
      ).length,

      pizzas: pizzas.length,

      availablePizzas: pizzas.filter(
        (pizza) => pizza.isAvailable !== false
      ).length,

      toppings: toppings.filter(
        (topping) =>
          topping.isAvailable !== false
      ).length,

      paidOrders: orders.filter(
        (order) => order.paymentStatus === "paid"
      ).length,

      codOrders: orders.filter(
        (order) => order.paymentStatus === "cod"
      ).length,

      pendingPayments: orders.filter(
        (order) =>
          order.paymentStatus === "pending"
      ).length,

      deliveredOrders,

      cancelledOrders,
    },

    money: {
      grossRevenue,

      revenue: grossRevenue,

      netRevenue: grossRevenue,

      netWorth: grossRevenue,

      todayRevenue,

      monthlyRevenue,

      averageOrderValue: paidOrders.length
        ? Math.round(
            grossRevenue / paidOrders.length
          )
        : 0,
    },

    performance: {
      conversionRate: orders.length
        ? Math.round(
            (paidOrders.length / orders.length) *
              100
          )
        : 0,

      fulfillmentRate: orders.length
        ? Math.round(
            (deliveredOrders / orders.length) *
              100
          )
        : 0,

      cancellationRate: orders.length
        ? Math.round(
            (cancelledOrders / orders.length) *
              100
          )
        : 0,
    },

    recentOrders: orders.slice(0, 6),

    topPizzas: Object.values(topPizzaMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),

    revenueSeries: [],

    razorpay,
  });
};

function AdminDashboard() {
  const navigate = useNavigate();

  const { user } = useSelector(
    (state) => state.auth
  );

  const [stats, setStats] =
    useState(emptyStats);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);

        setError("");

        setNotice("");

        const res = await axios.get(
          `${apiUrl}/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        setStats(normalizeStats(res.data));
      } catch (err) {
        try {
          const headers = {
            Authorization: `Bearer ${user.token}`,
          };

          const [
            ordersRes,
            usersRes,
            pizzasRes,
            toppingsRes,
            paymentRes,
          ] = await Promise.all([
            axios.get(`${apiUrl}/orders`, {
              headers,
            }),

            axios.get(
              `${apiUrl}/user/users`,
              {
                headers,
              }
            ),

            axios.get(`${apiUrl}/pizzas`),

            axios.get(`${apiUrl}/toppings`),

            axios
              .get(
                `${apiUrl}/payment/config`,
                { headers }
              )
              .catch(() => ({
                data: {
                  data: emptyStats.razorpay,
                },
              })),
          ]);

          setStats(
            buildFallbackStats({
              orders:
                ordersRes.data.data || [],

              users:
                usersRes.data.data || [],

              pizzas:
                pizzasRes.data.data || [],

              toppings:
                toppingsRes.data.data || [],

              razorpay:
                paymentRes.data.data ||
                emptyStats.razorpay,
            })
          );

          setNotice(
            "Dashboard is showing fallback data because /admin/stats is unavailable."
          );
        } catch (fallbackErr) {
          setError(
            fallbackErr.response?.data
              ?.error ||
              err.response?.data?.error ||
              "Failed to load admin dashboard"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/dashboard");
    } else {
      loadStats();
    }
  }, [user, navigate]);

  const maxRevenue = useMemo(() => {
    return Math.max(
      1,
      ...stats.revenueSeries.map(
        (item) => item.revenue || 0
      )
    );
  }, [stats.revenueSeries]);

  return (
    <main className="min-h-screen text-white p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-orange-300">
            Command Center
          </p>

          <h1 className="text-4xl font-black">
            Admin Dashboard
          </h1>
        </div>

        <Link
          to="/admin/orders"
          className="rounded-xl bg-orange-500 px-5 py-3 font-bold"
        >
          View Orders
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-500/20 p-4 text-red-100">
          {error}
        </div>
      )}

      {notice && !error && (
        <div className="mb-4 rounded-xl bg-sky-500/20 p-4 text-sky-100">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white/10"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Orders"
              value={stats.totals.orders}
            />

            <StatCard
              title="Users"
              value={stats.totals.users}
            />

            <StatCard
              title="Revenue"
              value={formatCurrency(
                stats.money.grossRevenue
              )}
            />

            <StatCard
              title="Pending Payments"
              value={
                stats.totals.pendingPayments
              }
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Panel title="Operations">
              <Metric
                label="Delivered"
                value={
                  stats.totals.deliveredOrders
                }
              />

              <Metric
                label="Cancelled"
                value={
                  stats.totals.cancelledOrders
                }
              />

              <Metric
                label="Fulfillment"
                value={`${stats.performance.fulfillmentRate}%`}
              />

              <Metric
                label="Cancellation"
                value={`${stats.performance.cancellationRate}%`}
              />
            </Panel>

            <Panel title="Revenue Analytics">
              <Metric
                label="Today Revenue"
                value={formatCurrency(
                  stats.money.todayRevenue
                )}
              />

              <Metric
                label="Monthly Revenue"
                value={formatCurrency(
                  stats.money.monthlyRevenue
                )}
              />

              <Metric
                label="Average Order"
                value={formatCurrency(
                  stats.money.averageOrderValue
                )}
              />

              <Metric
                label="Max Revenue"
                value={formatCurrency(maxRevenue)}
              />
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
      <h2 className="mb-4 text-2xl font-black">
        {title}
      </h2>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
      <span className="text-slate-300">
        {label}
      </span>

      <span className="font-black">
        {value}
      </span>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

export default AdminDashboard;