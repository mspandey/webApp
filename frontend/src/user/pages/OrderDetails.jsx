import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import LoadingScreen from "../../components/ui/LoadingScreen";

const steps = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

const STEP_LABELS = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

const STEP_ICONS = {
  placed: "🧾",
  confirmed: "✅",
  preparing: "👨‍🍳",
  out_for_delivery: "🛵",
  delivered: "🍕",
};

const POLL_INTERVAL = 20000;

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [justUpdated, setJustUpdated] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const prevStatusRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchOrder = async ({ silent = false } = {}) => {
    try {
      const res = await api.get(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const fetched = res.data.data;

      if (prevStatusRef.current && prevStatusRef.current !== fetched.orderStatus) {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 5000);
      }

      prevStatusRef.current = fetched.orderStatus;
      setOrder(fetched);
      setLastChecked(new Date());
    } catch {
      if (!silent) setError("Unable to load order details.");
    }
  };

  useEffect(() => {
    if (!id || !user) return;

    fetchOrder();

    intervalRef.current = setInterval(() => {
      setOrder((current) => {
        if (current?.orderStatus === "delivered" || current?.orderStatus === "cancelled") {
          clearInterval(intervalRef.current);
          return current;
        }
        fetchOrder({ silent: true });
        return current;
      });
    }, POLL_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [id, user]);

  if (error) return <p className="p-6 text-red-400">{error}</p>;
  if (!order)
    return (
      <LoadingScreen
        title="Loading order details"
        description="Fetching the timeline and status for this order."
      />
    );

  const isCancelled = order.orderStatus === "cancelled";
  const currentStep = isCancelled ? -1 : steps.indexOf(order.orderStatus);
  const isTerminal = order.orderStatus === "delivered" || isCancelled;

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            Order Timeline{" "}
            <span className="text-gray-400 text-sm font-normal">
              #{order._id.slice(-6)}
            </span>
          </h2>

          {!isTerminal ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live tracking
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 px-3 py-1 rounded-full">
              {isCancelled ? "❌ Cancelled" : "✅ Delivered"}
            </span>
          )}
        </div>

        {justUpdated && (
          <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm px-4 py-2 rounded-lg animate-pulse">
            🔔 Order status just updated!
          </div>
        )}

        {isCancelled ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 text-center text-red-400">
            <p className="text-2xl mb-1">❌</p>
            <p className="font-semibold text-lg">Order Cancelled</p>
            <p className="text-sm text-red-400/70 mt-1">This order has been cancelled.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-700 z-0" />
            <div className="space-y-6 relative z-10">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500
                        ${isCompleted
                          ? "bg-green-500 border-green-500"
                          : isCurrent
                          ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/30"
                          : "bg-gray-800 border-gray-600"
                        }`}
                    >
                      {isCurrent ? (
                        <span className="relative flex items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-orange-400 opacity-30" />
                          <span>{STEP_ICONS[step]}</span>
                        </span>
                      ) : (
                        <span className={isPending ? "opacity-30 grayscale" : ""}>
                          {isCompleted ? "✓" : STEP_ICONS[step]}
                        </span>
                      )}
                    </div>

                    <div className="pt-1.5">
                      <p className={`font-semibold ${
                        isCurrent ? "text-orange-400" : isCompleted ? "text-green-400" : "text-gray-500"
                      }`}>
                        {STEP_LABELS[step]}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-400 mt-0.5">Currently here</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="font-semibold">₹{order.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment</span>
            <span className={order.paymentStatus === "paid" || order.paymentStatus === "cod" ? "text-green-400 capitalize" : "text-yellow-400 capitalize"}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Address</span>
            <span className="text-right max-w-[60%] text-gray-300">{order.address}</span>
          </div>
        </div>

        <div className="mt-4 bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-sm font-semibold text-gray-300 mb-3">Items</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-400">
                <span>
                  {item.name}{" "}
                  <span className="text-gray-500 text-xs">
                    ({item.size?.name}, {item.crust?.name}) × {item.qty}
                  </span>
                </span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {lastChecked && !isTerminal && (
          <p className="text-center text-xs text-gray-600 mt-5">
            Last checked: {lastChecked.toLocaleTimeString()} · Auto-refreshes every 20s
          </p>
        )}
      </div>
    </div>
  );
}