import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { formatCurrency } from "../../utils/money";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    totals: { ...emptyStats.totals, ...(data.totals || {}) },
    money: { ...emptyStats.money, ...(data.money || {}) },

    performance: { ...emptyStats.performance, ...(data.performance || {}) },
    breakdowns: { ...emptyStats.breakdowns, ...(data.breakdowns || {}) },
    recentOrders: data.recentOrders || [],
    topPizzas: data.topPizzas || [],
    revenueSeries: data.revenueSeries || [],
    razorpay: { ...emptyStats.razorpay, ...(data.razorpay || {}) },

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


const buildFallbackStats = ({ orders = [], users = [], pizzas = [], toppings = [], razorpay = {} }) => {
  const paidOrders = orders.filter((order) => ["paid", "cod"].includes(order.paymentStatus));
  const today = startOfDay();
  const month = startOfMonth();
  const grossRevenue = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const todayRevenue = paidOrders
    .filter((order) => new Date(order.createdAt) >= today)
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const monthlyRevenue = paidOrders
    .filter((order) => new Date(order.createdAt) >= month)
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const deliveredOrders = orders.filter((order) => order.orderStatus === "delivered").length;
  const cancelledOrders = orders.filter((order) => order.orderStatus === "cancelled").length;

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
    (sum, order) => sum + (Number(order.totalAmount) || 0),
    0
  );

  const todayRevenue = paidOrders
    .filter((order) => new Date(order.createdAt) >= today)
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  const monthlyRevenue = paidOrders
    .filter((order) => new Date(order.createdAt) >= month)
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  const deliveredOrders = orders.filter(
    (order) => order.orderStatus === "delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.orderStatus === "cancelled"
  ).length;


  const topPizzaMap = paidOrders.reduce((acc, order) => {
    (order.items || []).forEach((item) => {
      const key = item.name || "Pizza";

      acc[key] = acc[key] || { _id: key, quantity: 0, revenue: 0 };
      acc[key].quantity += Number(item.qty) || 0;
      acc[key].revenue += (Number(item.price) || 0) * (Number(item.qty) || 0);
    });


      acc[key] = acc[key] || {
        _id: key,
        quantity: 0,
        revenue: 0,
      };

      acc[key].quantity += Number(item.qty) || 0;

      acc[key].revenue +=
        (Number(item.price) || 0) * (Number(item.qty) || 0);
    });


    return acc;
  }, {});

  return normalizeStats({
    totals: {
      orders: orders.length,
      users: users.length,

      activeUsers: users.filter((item) => item.status !== "inactive").length,
      pizzas: pizzas.length,
      availablePizzas: pizzas.filter((item) => item.isAvailable !== false).length,
      toppings: toppings.filter((item) => item.isAvailable !== false).length,
      paidOrders: orders.filter((order) => order.paymentStatus === "paid").length,
      codOrders: orders.filter((order) => order.paymentStatus === "cod").length,
      pendingPayments: orders.filter((order) => order.paymentStatus === "pending").length,
      deliveredOrders,
      cancelledOrders,
    },

      activeUsers: users.filter((u) => u.status !== "inactive").length,
      pizzas: pizzas.length,
      availablePizzas: pizzas.filter((p) => p.isAvailable !== false).length,
      toppings: toppings.filter((t) => t.isAvailable !== false).length,
      paidOrders: orders.filter((o) => o.paymentStatus === "paid").length,
      codOrders: orders.filter((o) => o.paymentStatus === "cod").length,
      pendingPayments: orders.filter(
        (o) => o.paymentStatus === "pending"
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

      averageOrderValue: paidOrders.length ? Math.round(grossRevenue / paidOrders.length) : 0,
    },
    performance: {
      conversionRate: orders.length ? Math.round((paidOrders.length / orders.length) * 100) : 0,
      fulfillmentRate: orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0,
      cancellationRate: orders.length ? Math.round((cancelledOrders / orders.length) * 100) : 0,
    },
    recentOrders: orders.slice(0, 6),
    topPizzas: Object.values(topPizzaMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5),

      averageOrderValue: paidOrders.length
        ? Math.round(grossRevenue / paidOrders.length)
        : 0,
    },

    performance: {
      conversionRate: orders.length
        ? Math.round((paidOrders.length / orders.length) * 100)
        : 0,

      fulfillmentRate: orders.length
        ? Math.round((deliveredOrders / orders.length) * 100)
        : 0,

      cancellationRate: orders.length
        ? Math.round((cancelledOrders / orders.length) * 100)
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

  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");


  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        setNotice("");
        const res = await axios.get(`${apiUrl}/admin/stats`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStats(normalizeStats(res.data));
      } catch (err) {
        try {
          const headers = { Authorization: `Bearer ${user.token}` };
          const [ordersRes, usersRes, pizzasRes, toppingsRes, paymentRes] = await Promise.all([
            axios.get(`${apiUrl}/orders`, { headers }),
            axios.get(`${apiUrl}/user/users`, { headers }),
            axios.get(`${apiUrl}/pizzas`),
            axios.get(`${apiUrl}/toppings`),
            axios.get(`${apiUrl}/payment/config`, { headers }).catch(() => ({ data: { data: emptyStats.razorpay } })),
          ]);

          setStats(buildFallbackStats({
            orders: ordersRes.data.data || [],
            users: usersRes.data.data || [],
            pizzas: pizzasRes.data.data || [],
            toppings: toppingsRes.data.data || [],
            razorpay: paymentRes.data.data || emptyStats.razorpay,
          }));
          setNotice("Dashboard is showing live data from orders/users/menu endpoints while /admin/stats is unavailable.");
        } catch (fallbackErr) {
          setError(fallbackErr.response?.data?.error || err.response?.data?.error || "Failed to load admin dashboard");


        const res = await axios.get(`${apiUrl}/admin/stats`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

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
            axios.get(`${apiUrl}/orders`, { headers }),

            axios.get(`${apiUrl}/user/users`, {
              headers,
            }),

            axios.get(`${apiUrl}/pizzas`),

            axios.get(`${apiUrl}/toppings`),

            axios
              .get(`${apiUrl}/payment/config`, { headers })
              .catch(() => ({
                data: {
                  data: emptyStats.razorpay,
                },
              })),
          ]);

          setStats(
            buildFallbackStats({
              orders: ordersRes.data.data || [],
              users: usersRes.data.data || [],
              pizzas: pizzasRes.data.data || [],
              toppings: toppingsRes.data.data || [],
              razorpay: paymentRes.data.data || emptyStats.razorpay,
            })
          );

          setError(
            "Using fallback dashboard data because /admin/stats is not available yet."
          );
        } catch (fallbackErr) {
          setError(
            fallbackErr.response?.data?.error ||
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


  const maxRevenue = useMemo(
    () => Math.max(1, ...stats.revenueSeries.map((item) => item.revenue || 0)),
    [stats.revenueSeries]
  );

  const maxRevenue = useMemo(() => {
    return Math.max(
      1,
      ...stats.revenueSeries.map((item) => item.revenue || 0)
    );
  }, [stats.revenueSeries]);


  const statCards = [
    {
      title: "Net Worth",
      value: formatCurrency(stats.money.netWorth),
      note: "Paid + COD business value",
      icon: "💎",
      accent: "from-emerald-400 to-lime-300",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.money.grossRevenue),
      note: `${formatCurrency(stats.money.todayRevenue)} today`,
      icon: "💰",
      accent: "from-orange-400 to-red-400",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.money.monthlyRevenue),
      note: `${formatCurrency(stats.money.averageOrderValue)} avg order`,
      icon: "📈",
      accent: "from-sky-400 to-indigo-400",
    },
    {
      title: "Pending Payments",
      value: stats.totals.pendingPayments,
      note: "Needs payment follow-up",
      icon: "⏳",
      accent: "from-amber-300 to-yellow-500",
    },
  ];

  return (
    <main className="min-h-screen text-white">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>

          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">Command center</p>
          <h1 className="mt-2 text-4xl font-black">Admin Dashboard</h1>
          <p className="mt-3 text-slate-400">Track net worth, revenue, orders, users, menu health, and payments in one place.</p>
        </div>

        <div className={`rounded-2xl border px-5 py-4 ${stats.razorpay.isLive ? "border-emerald-300/30 bg-emerald-400/10" : "border-amber-300/30 bg-amber-400/10"}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Razorpay</p>
          <p className="mt-1 text-lg font-black">
            {stats.razorpay.isLive ? "Live payments active" : stats.razorpay.isConfigured ? "Test mode / not live" : "Not configured"}
          </p>
          <p className="text-xs text-slate-400">Key: {stats.razorpay.keyPrefix}</p>
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-100">{error}</div>}
      {notice && !error && <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sky-100">{notice}</div>}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl bg-white/10" />)}
        </div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.title} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <p className="mt-2 text-3xl font-black">{card.value}</p>
                  </div>
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${card.accent} text-2xl shadow-lg`}>{card.icon}</div>
                </div>
                <p className="mt-4 text-sm text-slate-400">{card.note}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">7-day revenue</h2>
                  <p className="text-sm text-slate-400">Paid and COD revenue trend</p>
                </div>
                <Link to="/admin/orders" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400">View orders</Link>
              </div>

              <div className="flex h-72 items-end gap-3 rounded-3xl bg-black/25 p-4">
                {stats.revenueSeries.length ? stats.revenueSeries.map((item) => (
                  <div key={item._id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full items-end rounded-t-2xl bg-white/5" style={{ height: "220px" }}>
                      <div
                        className="w-full rounded-t-2xl bg-gradient-to-t from-orange-500 to-amber-200 shadow-lg shadow-orange-950/30"
                        style={{ height: `${Math.max(10, ((item.revenue || 0) / maxRevenue) * 100)}%` }}
                        title={`${item._id}: ${formatCurrency(item.revenue)}`}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{item._id?.slice(5)}</p>
                  </div>
                )) : <p className="m-auto text-slate-400">No paid revenue yet.</p>}
              </div>
            </div>

            <div className="space-y-6">
              <Panel title="Operations health">
                <Metric label="Orders" value={stats.totals.orders} />
                <Metric label="Delivered" value={stats.totals.deliveredOrders} />
                <Metric label="Fulfillment" value={`${stats.performance.fulfillmentRate}%`} />
                <Metric label="Cancellation" value={`${stats.performance.cancellationRate}%`} danger={stats.performance.cancellationRate > 10} />
              </Panel>

              <Panel title="Menu & users">
                <Metric label="Users" value={stats.totals.users} />
                <Metric label="Active Users" value={stats.totals.activeUsers} />
                <Metric label="Pizzas Live" value={`${stats.totals.availablePizzas}/${stats.totals.pizzas}`} />
                <Metric label="Toppings" value={stats.totals.toppings} />
              </Panel>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Top pizzas">
              {stats.topPizzas.length ? stats.topPizzas.map((pizza, index) => (
                <div key={pizza._id || index} className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
                  <div>
                    <p className="font-bold">#{index + 1} {pizza._id}</p>
                    <p className="text-sm text-slate-400">{pizza.quantity} sold</p>
                  </div>
                  <p className="font-black text-orange-200">{formatCurrency(pizza.revenue)}</p>
                </div>
              )) : <p className="text-slate-400">No sales data yet.</p>}
            </Panel>

            <Panel title="Recent orders">
              {stats.recentOrders.length ? stats.recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
                  <div>
                    <p className="font-bold">#{order._id.slice(-6)} • {order.user?.name || "Guest"}</p>
                    <p className="text-sm capitalize text-slate-400">{order.orderStatus} • {order.paymentStatus}</p>
                  </div>
                  <p className="font-black text-emerald-200">{formatCurrency(order.totalAmount)}</p>
                </div>
              )) : <p className="text-slate-400">No orders yet.</p>}

          <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">
            Command center
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Admin Dashboard
          </h1>

          <p className="mt-3 text-slate-400">
            Track net worth, revenue, orders, users, menu health,
            and payments in one place.
          </p>
        </div>

        <div
          className={`rounded-2xl border px-5 py-4 ${
            stats.razorpay.isLive
              ? "border-emerald-300/30 bg-emerald-400/10"
              : "border-amber-300/30 bg-amber-400/10"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Razorpay
          </p>

          <p className="mt-1 text-lg font-black">
            {stats.razorpay.isLive
              ? "Live payments active"
              : stats.razorpay.isConfigured
              ? "Test mode / not live"
              : "Not configured"}
          </p>

          <p className="text-xs text-slate-400">
            Key: {stats.razorpay.keyPrefix}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl bg-white/10"
            />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      {card.title}
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {card.value}
                    </p>
                  </div>

                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${card.accent} text-2xl shadow-lg`}
                  >
                    {card.icon}
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  {card.note}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">
                    7-day revenue
                  </h2>

                  <p className="text-sm text-slate-400">
                    Paid and COD revenue trend
                  </p>
                </div>

                <Link
                  to="/admin/orders"
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400"
                >
                  View orders
                </Link>
              </div>

              <div className="flex h-72 items-end gap-3 rounded-3xl bg-black/25 p-4">
                {stats.revenueSeries.length ? (
                  stats.revenueSeries.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div
                        className="flex w-full items-end rounded-t-2xl bg-white/5"
                        style={{ height: "220px" }}
                      >
                        <div
                          className="w-full rounded-t-2xl bg-gradient-to-t from-orange-500 to-amber-200 shadow-lg shadow-orange-950/30"
                          style={{
                            height: `${Math.max(
                              10,
                              ((item.revenue || 0) / maxRevenue) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="text-xs text-slate-400">
                        {item._id?.slice(5)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="m-auto text-slate-400">
                    No paid revenue yet.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <Panel title="Operations health">
                <Metric
                  label="Orders"
                  value={stats.totals.orders}
                />

                <Metric
                  label="Delivered"
                  value={stats.totals.deliveredOrders}
                />

                <Metric
                  label="Fulfillment"
                  value={`${stats.performance.fulfillmentRate}%`}
                />

                <Metric
                  label="Cancellation"
                  value={`${stats.performance.cancellationRate}%`}
                  danger={
                    stats.performance.cancellationRate > 10
                  }
                />
              </Panel>

              <Panel title="Menu & users">
                <Metric
                  label="Users"
                  value={stats.totals.users}
                />

                <Metric
                  label="Active Users"
                  value={stats.totals.activeUsers}
                />

                <Metric
                  label="Pizzas Live"
                  value={`${stats.totals.availablePizzas}/${stats.totals.pizzas}`}
                />

                <Metric
                  label="Toppings"
                  value={stats.totals.toppings}
                />
              </Panel>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Top pizzas">
              {stats.topPizzas.length ? (
                stats.topPizzas.map((pizza, index) => (
                  <div
                    key={pizza._id || index}
                    className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"
                  >
                    <div>
                      <p className="font-bold">
                        #{index + 1} {pizza._id}
                      </p>

                      <p className="text-sm text-slate-400">
                        {pizza.quantity} sold
                      </p>
                    </div>

                    <p className="font-black text-orange-200">
                      {formatCurrency(pizza.revenue)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">
                  No sales data yet.
                </p>
              )}
            </Panel>

            <Panel title="Recent orders">
              {stats.recentOrders.length ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3"
                  >
                    <div>
                      <p className="font-bold">
                        #{order._id.slice(-6)} •{" "}
                        {order.user?.name || "Guest"}
                      </p>

                      <p className="text-sm capitalize text-slate-400">
                        {order.orderStatus} •{" "}
                        {order.paymentStatus}
                      </p>
                    </div>

                    <p className="font-black text-emerald-200">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">
                  No orders yet.
                </p>
              )}

            </Panel>
          </section>
        </>
      )}
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
      <h2 className="mb-4 text-xl font-black">{title}</h2>




      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Metric({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
      <span className="text-slate-400">{label}</span>

      <span className={`font-black ${danger ? "text-red-300" : "text-white"}`}>{value}</span>


      <span
        className={`font-black ${
          danger ? "text-red-300" : "text-white"
        }`}
      >
        {value}
      </span>

    </div>
  );
}

export default AdminDashboard;