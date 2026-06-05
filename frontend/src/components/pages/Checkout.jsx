import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";

function Checkout() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [availableCouponsLoading, setAvailableCouponsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);

  const items = useMemo(() => cart?.items || [], [cart]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  // Fetch available coupons on mount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setAvailableCouponsLoading(true);
        const res = await api.get("/coupons/available");
        setAvailableCoupons(res.data.data);
      } catch (err) {
        console.error("Failed to fetch available coupons", err);
      } finally {
        setAvailableCouponsLoading(false);
      }
    };
    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyCoupon = async (code = null) => {
    const codeToApply = code || couponCode.trim();
    if (!codeToApply) return;
    try {
      setCouponLoading(true);
      setCouponError("");
      const res = await api.post("/coupons/validate", {
        code: codeToApply,
        subtotal,
      });
      setDiscount(res.data.data.discount);
      setAppliedCode(res.data.data.code);
      if (!code) {
        // If we were using the input, clear it
        setCouponCode("");
      }
    } catch (err) {
      setDiscount(0);
      setAppliedCode("");
      setCouponError(err.response?.data?.error || "Invalid coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCode("");
    setCouponCode("");
    setCouponError("");
  };

  useEffect(() => {
    if (!user) navigate("/login");
    if (cart && items.length === 0) navigate("/cart");
  }, [user, cart, items.length, navigate]);

  const createOrder = async () => {
    const res = await api.post("/orders", {
      address,
      phone,
      paymentMethod,
      deliveryFee,
      couponCode: appliedCode || undefined,
    });
    return res.data.data;
  };

  const handleCodOrder = async () => {
    await createOrder();
    dispatch(clearCart());
    navigate("/orders");
  };

  const handleOnlinePayment = async () => {
    if (!window.Razorpay) {
      setError("Razorpay script is not loaded. Please choose Cash on Delivery or add Razorpay checkout script in index.html.");
      return;
    }

    const orderData = await createOrder();
    const paymentRes = await api.post("/payment/create-order", { orderId: orderData._id });
    const { order, key } = paymentRes.data;

    const options = {
      key,
      amount: order.amount,
      currency: "INR",
      name: "PizzaCraft",
      description: "Customized pizza order",
      order_id: order.id,
      handler: async (response) => {
        await api.post("/payment/verify", { ...response, orderId: orderData._id });
        dispatch(clearCart());
        navigate("/orders");
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: phone,
      },
      theme: { color: "#f97316" },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const placeOrder = async () => {
    if (!address.trim() || address.trim().length < 12) {
      setError("Please enter a complete delivery address.");
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (paymentMethod === "cod") await handleCodOrder();
      else await handleOnlinePayment();
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/cart" className="text-sm font-semibold text-orange-200 hover:text-orange-100">{"\u2190"} Back to cart</Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">Checkout</p>
            <h1 className="mt-2 text-4xl font-black">Delivery & payment</h1>
            <p className="mt-3 text-slate-400">Add your delivery details and choose how you want to pay.</p>

            <div className="mt-8 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-orange-400/40 placeholder:text-slate-500 focus:ring-4"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="address">Delivery address</label>
                <textarea
                  id="address"
                  placeholder="House no, street, area, city, pincode..."
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-orange-400/40 placeholder:text-slate-500 focus:ring-4"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200" htmlFor="coupon">Coupon code</label>
                {appliedCode ? (
                  <div className="flex items-center justify-between rounded-2xl border border-green-400/30 bg-green-500/10 px-5 py-4">
                    <span className="text-sm font-semibold text-green-100">
                      {appliedCode} applied
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-sm font-semibold text-orange-200 hover:text-orange-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      id="coupon"
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                      placeholder="SAVE20"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-orange-400/40 placeholder:text-slate-500 focus:ring-4"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      disabled={couponLoading}
                      className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 font-bold transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </button>
                  </div>
                )}
                {couponError && <p className="mt-2 text-sm text-red-300">{couponError}</p>}

                {/* Available Coupons Section */}
                {!appliedCode && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-slate-200 mb-3">Available Offers</h3>
                    {availableCouponsLoading ? (
                      <div className="text-sm text-slate-400">Loading offers...</div>
                    ) : availableCoupons.length > 0 ? (
                      <div className="space-y-3">
                        {availableCoupons.map((coupon) => {
                          // Check eligibility for current subtotal
                          const isEligible = subtotal >= (coupon.minOrderAmount || 0);
                          return (
                            <div
                              key={coupon._id}
                              onClick={() => isEligible && setCouponCode(coupon.code)}
                              className={`rounded-2xl border p-4 transition ${
                                isEligible
                                  ? "border-orange-300/50 bg-orange-400/10 cursor-pointer hover:border-orange-400"
                                  : "border-white/10 bg-white/[0.06] opacity-70 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-lg text-orange-200">{coupon.code}</span>
                                    {isEligible && (
                                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                        Eligible
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-300 mt-1">
                                    {coupon.description || "Get discount on your order"}
                                  </p>
                                  <div className="text-xs text-slate-400 mt-2">
                                    {coupon.discountType === "percent"
                                      ? `${coupon.discountValue}% off`
                                      : `Flat ${formatCurrency(coupon.discountValue)} off`}
                                    {coupon.minOrderAmount > 0 && ` on orders above ${formatCurrency(coupon.minOrderAmount)}`}
                                    {coupon.maxDiscount > 0 && coupon.discountType === "percent" && (
                                      ` • Max ${formatCurrency(coupon.maxDiscount)}`
                                    )}
                                    {coupon.expiresAt && (
                                      ` • Expires on ${new Date(coupon.expiresAt).toLocaleDateString()}`
                                    )}
                                    {coupon.usageLimit > 0 && (
                                      ` • ${coupon.usageLimit - coupon.usedCount} uses left`
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyCouponCode(coupon.code);
                                    }}
                                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.08] hover:bg-white/[0.14]"
                                  >
                                    {copiedCode === coupon.code ? "Copied!" : "Copy"}
                                  </button>
                                  {isEligible && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        applyCoupon(coupon.code);
                                      }}
                                      disabled={couponLoading}
                                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 disabled:opacity-60"
                                    >
                                      Apply
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">No offers available at the moment.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-black">Payment method</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    ["cod", "Cash on Delivery", "Pay when your pizza arrives."],
                    ["online", "Razorpay Online", "Cards, UPI, wallets, and net banking."],
                  ].map(([value, title, copy]) => (
                    <button
                      key={value}
                      onClick={() => setPaymentMethod(value)}
                      className={`rounded-2xl border p-5 text-left transition ${paymentMethod === value ? "border-orange-300 bg-orange-400/20" : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"}`}
                    >
                      <span className="block font-black">{title}</span>
                      <span className="mt-2 block text-sm text-slate-300">{copy}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-100">{error}</p>}

              <button
                onClick={placeOrder}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-7 py-4 text-lg font-black shadow-xl shadow-red-950/30 transition hover:from-red-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Placing order..." : paymentMethod === "cod" ? "Place COD Order" : "Pay Securely"}
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur lg:sticky lg:top-24">
            <h2 className="text-2xl font-black">Order summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between gap-4 text-sm text-slate-300">
                  <span>{item.name} {"\u00d7"} {item.qty}</span>
                  <span>{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-4 border-t border-white/10 pt-5 text-slate-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? formatCurrency(deliveryFee) : "Free"}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-300"><span>Discount{appliedCode ? ` (${appliedCode})` : ""}</span><span>-{formatCurrency(discount)}</span></div>
              )}
              <div className="flex justify-between text-2xl font-black text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            <p className="mt-5 text-xs leading-6 text-slate-400">{"\uD83D\uDD12"} Online payments are verified server-side. COD orders are immediately sent to the kitchen.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
