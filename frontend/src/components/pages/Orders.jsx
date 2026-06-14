import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../ui/LoadingScreen";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/orders/my`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setOrders(res.data.data);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user, navigate, fetchOrders]);

  const payNow = async (orderId) => {
    try {
      // 1️⃣ Create Razorpay order for existing order
      const paymentRes = await axios.post(
        `${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/payment/pay-existing-order`,
        { orderId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { order, key } = paymentRes.data;

      // 2️⃣ Open Razorpay popup
      const options = {
        key,
        amount: order.amount,
        currency: "INR",
        name: "Pizza App",
        description: "Complete your payment",
        order_id: order.id,

        handler: async function (response) {
          // 3️⃣ Verify payment
          await axios.post(
            `${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/payment/verify`,
            { ...response, orderId },
            { headers: { Authorization: `Bearer ${user.token}` } }
          );

          alert("Payment successful ✅");
          fetchOrders(); // reload orders
        },

        prefill: {
          name: user.name,
          email: user.email,
        },

        theme: { color: "#ef4444" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch {
      alert("Payment failed ❌");
    }
  };

  if (loading)
    return (
      <LoadingScreen
        title="Loading your orders"
        description="Fetching your latest pizza orders and payment updates."
      />
    );
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (orders.length === 0) return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col items-center justify-start pt-32">
      <div className="text-center">
        <div className="text-6xl mb-4">🍕</div>
        <h2 className="text-3xl font-bold text-white mb-2">No Orders Yet</h2>
        <p className="text-gray-400 mb-6 max-w-sm">
          You haven't placed any orders yet. Start exploring our delicious pizzas and place your first order!
        </p>
        <a
          href="/"
          className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-lg transition duration-300"
        >
          Order Now
        </a>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h2 className="text-xl font-bold mb-4">My Orders</h2>

      {orders.map((o) => (
        <div
          key={o._id}
          className="bg-gray-800 p-4 mb-4 rounded border border-gray-700"
        >
          <div className="flex justify-between">
            <span className="font-semibold">Order ID:</span>
            <span className="text-sm text-gray-400">
              {o._id.slice(-6)}
            </span>
          </div>

          <p className="mt-2">
            <strong>Total:</strong> ₹{o.totalAmount}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize">{o.orderStatus}</span>
          </p>

          <p>
            <strong>Payment:</strong>{" "}
            <span
              className={`capitalize ${
                o.paymentStatus === "pending"
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {o.paymentStatus}
            </span>
          </p>

          <p className="text-sm text-gray-400 mt-1">
            {new Date(o.createdAt).toLocaleString()}
          </p>

          {/* Items */}
          <div className="mt-3 border-t border-gray-700 pt-2">
            {o.items.map((item, i) => (
              <div key={i} className="text-sm text-gray-300">
                {item.name} ({item.size?.name}, {item.crust?.name}) × {item.qty}
              </div>
            ))}
          </div>

          {/* Pay Now Button */}
          {o.paymentStatus === "pending" && (
            <button
              onClick={() => payNow(o._id)}
              className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Pay Now 💳
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Orders;
