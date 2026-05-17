import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { formatCurrency } from "../../utils/money";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emptyStats = { totals: { orders: 0, users: 0, activeUsers: 0, pizzas: 0, availablePizzas: 0, toppings: 0, paidOrders: 0, codOrders: 0, pendingPayments: 0, deliveredOrders: 0, cancelledOrders: 0 }, money: { grossRevenue: 0, revenue: 0, netRevenue: 0, netWorth: 0, todayRevenue: 0, monthlyRevenue: 0, averageOrderValue: 0 }, performance: { conversionRate: 0, fulfillmentRate: 0, cancellationRate: 0 }, breakdowns: { orderStatus: {}, paymentStatus: {} }, recentOrders: [], topPizzas: [], revenueSeries: [], razorpay: { mode: "not_configured", detectedMode: "not_configured", isConfigured: false, isLive: false, keyPrefix: "missing" } };

const normalizeStats = (payload) => {
  const data = payload?.data || payload || {};


const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; };

const buildFallbackStats = ({ orders = [], users = [], pizzas = [], toppings = [], razorpay = {} }) => {
  const paidOrders = orders.filter((o) => ["paid", "cod"].includes(o.paymentStatus));
  const grossRevenue = paidOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const todayRevenue = paidOrders.filter((o) => new Date(o.createdAt) >= startOfDay()).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const monthlyRevenue = paidOrders.filter((o) => new Date(o.createdAt) >= startOfMonth()).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled").length;

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


  const topPizzaMap = paidOrders.reduce((acc, order) => {
    (order.items || []).forEach((item) => {
      const key = item.name || "Pizza";
      acc[key] = acc[key] || { _id: key, quantity: 0, revenue: 0 };
      acc[key].quantity += Number(item.qty) || 0;
      acc[key].revenue += (Number(item.price) || 0) * (Number(item.qty) || 0);
    });
    return acc;
  }, {});


function Metric({ label, value }) { return <div className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"><span className="text-slate-300">{label}</span><span className="font-bold">{value}</span></div>; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);


  return normalizeStats({
    totals: {
      orders: orders.length,
      users: users.length,
      activeUsers: users.filter((u) => u.status !== "inactive").length,
      pizzas: pizzas.length,
      availablePizzas: pizzas.filter((p) => p.isAvailable !== false).length,
      toppings: toppings.filter((t) => t.isAvailable !== false).length,
      paidOrders: orders.filter((o) => o.paymentStatus === "paid").length,
      codOrders: orders.filter((o) => o.paymentStatus === "cod").length,
      pendingPayments: orders.filter((o) => o.paymentStatus === "pending").length,
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

  useEffect(() => {
    const load = async () => {
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

          setStats(
            buildFallbackStats({
              orders: ordersRes.data.data || [],
              users: usersRes.data.data || [],
              pizzas: pizzasRes.data.data || [],
              toppings: toppingsRes.data.data || [],
              razorpay: paymentRes.data.data || emptyStats.razorpay,
            })
          );
          setNotice("Dashboard is showing live data from fallback endpoints while /admin/stats is unavailable.");
        } catch (fallbackErr) {
          setError(fallbackErr.response?.data?.error || err.response?.data?.error || "Failed to load admin dashboard");

        }
      } finally { setLoading(false); }
    };


    if (!user) navigate("/login");
    else if (user.role !== "admin") navigate("/dashboard");
    else loadStats();
  }, [user, navigate]);

  const maxRevenue = useMemo(() => Math.max(1, ...stats.revenueSeries.map((item) => item.revenue || 0)), [stats.revenueSeries]);

  return (
    <main className="min-h-screen text-white">
      <h1 className="text-4xl font-black">Admin Dashboard</h1>
      {error && <div>{error}</div>}
      {notice && !error && <div>{notice}</div>}
      {!loading && <div className="mt-4">Max revenue: {formatCurrency(maxRevenue)}</div>}
      <Link to="/admin/orders">View orders</Link>
    </main>
  );
}

export default AdminDashboard;

