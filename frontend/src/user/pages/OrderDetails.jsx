import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import LoadingScreen from "../../components/ui/LoadingScreen";

const steps = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setOrder(res.data.data);
      } catch {
        setError("Unable to load order details.");
      }
    };

    if (id && user) loadOrder();
  }, [id, user]);

  if (error) return <p className="p-6 text-red-400">{error}</p>;
  if (!order)
    return (
      <LoadingScreen
        title="Loading order details"
        description="Fetching the timeline and status for this order."
      />
    );

  const currentStep = steps.indexOf(order.orderStatus);

  return (
    <div className="p-6 text-white">
      <h2 className="mb-4 text-xl font-bold">Order Timeline #{order._id.slice(-6)}</h2>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${index <= currentStep ? "bg-green-500" : "bg-gray-600"}`} />
            <span>{step.replaceAll("_", " ").toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
