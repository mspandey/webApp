import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}`;

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const { user } = useSelector((s) => s.auth);
  const token = user?.token;

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API}/coupons`, authHeader);
      setCoupons(res.data.data);
    } catch {
      setError("Failed to load coupons");
    }
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setIsPublic(true);
  };

  const createCoupon = async () => {
    if (!code || !discountValue) {
      alert("Code and discount value are required");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/coupons`,
        {
          code,
          description,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount) || 0,
          maxDiscount: Number(maxDiscount) || 0,
          usageLimit: Number(usageLimit) || 0,
          expiresAt: expiresAt || null,
          isPublic,
        },
        authHeader
      );
      resetForm();
      fetchCoupons();
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await axios.put(
        `${API}/coupons/${coupon._id}`,
        { isActive: !coupon.isActive },
        authHeader
      );
      fetchCoupons();
    } catch {
      alert("Failed to update coupon");
    }
  };

  const togglePublic = async (coupon) => {
    try {
      await axios.put(
        `${API}/coupons/${coupon._id}`,
        { isPublic: !coupon.isPublic },
        authHeader
      );
      fetchCoupons();
    } catch {
      alert("Failed to update coupon visibility");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`${API}/coupons/${id}`, authHeader);
      fetchCoupons();
    } catch {
      alert("Failed to delete coupon");
    }
  };

  const formatDiscount = (c) =>
    c.discountType === "percent"
      ? `${c.discountValue}% off`
      : `\u20B9${c.discountValue} off`;

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6">Manage Coupons</h2>

      {/* Create coupon form */}
      <div className="bg-gray-800 p-4 rounded mb-6 max-w-md">
        <h3 className="font-semibold mb-3">Create New Coupon</h3>

        <input
          type="text"
          placeholder="Code (e.g. SAVE20)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        >
          <option value="percent">Percentage (%)</option>
          <option value="flat">Flat amount</option>
        </select>

        <input
          type="number"
          placeholder={discountType === "percent" ? "Discount %" : "Discount amount"}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        <input
          type="number"
          placeholder="Minimum order amount (optional)"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        {discountType === "percent" && (
          <input
            type="number"
            placeholder="Max discount cap (optional)"
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            className="w-full p-2 mb-2 rounded text-black"
          />
        )}

        <input
          type="number"
          placeholder="Usage limit (0 = unlimited)"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        <label className="block text-sm text-gray-400 mb-1">Expiry date (optional)</label>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full p-2 mb-3 rounded text-black"
        />

        <div className="flex items-center mb-3">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isPublic" className="text-sm text-gray-300">Publicly Visible</label>
        </div>

        <button
          onClick={createCoupon}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Coupon"}
        </button>
      </div>

      {/* Coupons list */}
      <div className="space-y-3">
        {error && <p className="text-red-400">{error}</p>}

        {coupons.length === 0 && !error && (
          <p className="text-gray-400">No coupons yet.</p>
        )}

        {coupons.map((c) => (
          <div
            key={c._id}
            className="bg-gray-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {c.code}{" "}
                <span className="text-sm text-gray-400">({formatDiscount(c)})</span>
              </p>
              {c.description && (
                <p className="text-sm text-gray-400">{c.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {c.minOrderAmount > 0 && `Min order \u20B9${c.minOrderAmount}. `}
                {c.maxDiscount > 0 && `Max discount \u20B9${c.maxDiscount}. `}
                {c.usageLimit > 0
                  ? `Used ${c.usedCount}/${c.usageLimit}. `
                  : `Used ${c.usedCount}. `}
                {c.expiresAt &&
                  `Expires ${new Date(c.expiresAt).toLocaleDateString()}.`}
              </p>
              <p
                className={`text-xs ${
                  c.isActive ? "text-green-400" : "text-gray-500"
                }`}
              >
                {c.isActive ? "Active" : "Inactive"} • {c.isPublic !== false ? "Public" : "Private"}
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <button
                onClick={() => toggleActive(c)}
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                {c.isActive ? "Disable" : "Enable"}
              </button>
              <button
                onClick={() => togglePublic(c)}
                className="text-orange-400 hover:text-orange-300 text-sm"
              >
                {c.isPublic !== false ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => deleteCoupon(c._id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}