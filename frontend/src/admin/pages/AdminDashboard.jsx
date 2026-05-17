import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState({
    orders: 0,
    users: 0,
    revenue: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin/stats`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStats(res.data);
      } catch {
        console.error("Failed to load stats");
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

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard 👨‍🍳</h2>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Orders" value={stats.orders} />
        <StatCard title="Total Users" value={stats.users} />
        <StatCard title="Revenue" value={`₹${stats.revenue}`} />
        <StatCard title="Pending Payments" value={stats.pendingPayments} />
      </div>

      <h3 className="text-xl font-semibold mb-4">Quick Management</h3>

      <div className="grid md:grid-cols-3 gap-4">
        <AdminCard title="Manage Pizzas" link="/admin/pizzas" />
        <AdminCard title="Manage Toppings" link="/admin/toppings" />
        <AdminCard title="Manage Orders" link="/admin/orders" />
        <AdminCard title="Users" link="/admin/users" />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function AdminCard({ title, link }) {
  return (
    <Link to={link} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition border border-gray-700">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">Open</p>
    </Link>
  );
}

export default AdminDashboard;
