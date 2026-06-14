import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import LoadingScreen from "../../components/ui/LoadingScreen";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useSelector((s) => s.auth);
  const token = user?.token;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/orders`    , {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/orders/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadOrders();
    } catch {
      alert("Failed to update order status");
    }
  };

  if (loading)
    return (
      <LoadingScreen
        title="Loading orders"
        description="Fetching the latest orders, payment states, and customer details."
      />
    );
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="text-white">

      <h2 className="text-2xl font-bold mb-6">Manage Orders 📦</h2>

      {orders.length === 0 && <p>No orders found.</p>}

      <div className="space-y-4">

        {orders.map((o) => (
          <div
            key={o._id}
            className="bg-gray-800 p-4 rounded-xl border border-gray-700"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">
                Order #{o._id.slice(-6)}
              </p>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  o.paymentStatus === "paid"
                    ? "bg-green-600"
                    : "bg-yellow-600"
                }`}
              >
                {o.paymentStatus.toUpperCase()}
              </span>
            </div>

            {/* Details */}
            <p>Total: ₹{o.totalAmount}</p>
            <p>User: {o.user?.name || "N/A"}</p>

            {/* Items */}
            <div className="mt-2 text-sm text-gray-300">
              {o.items.map((item, i) => (
                <div key={i}>
                  • {item.name} ({item.size?.name}, {item.crust?.name}) × {item.qty}
                </div>
              ))}
            </div>

            {/* Status update */}
            <div className="mt-3 flex items-center gap-3">
              <span>Status:</span>

              <select
                value={o.orderStatus}
                onChange={(e) => updateStatus(o._id, e.target.value)}
                className="text-black p-1 rounded"
              >
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {new Date(o.createdAt).toLocaleString()}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}
