import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, removeItem, updateCartItemQty } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);
  const [updatedId, setUpdatedId] = useState(null);

  const { cart, isLoading, isError, message } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  const changeQty = (id, nextQty) => {
    if (nextQty < 1) {
      setRemovingId(id);
      setTimeout(() => {
        dispatch(removeItem(id));
        setRemovingId(null);
      }, 300);
      return;
    }
    setUpdatedId(id);
    setTimeout(() => setUpdatedId(null), 400);
    dispatch(updateCartItemQty({ id, qty: nextQty }));
  };

  if (isLoading && !cart) {
    return (
      <div className="min-h-screen bg-[#080411] px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-3xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">Your cart</p>
            <h1 className="mt-2 text-4xl font-black">
              Review your order
              {totalItems > 0 && (
                <span className="ml-3 align-middle rounded-full bg-orange-500 px-3 py-1 text-lg font-bold text-white">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
            <p className="mt-3 text-slate-400">Update quantities, remove items, and continue to checkout.</p>
          </div>
          <Link to="/" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center font-bold hover:bg-white/[0.1]">
            Add more pizza
          </Link>
        </div>

        {isError && (
          <p className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-100">
            {message}
          </p>
        )}

        {items.length === 0 ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-16 text-center shadow-2xl shadow-black/20">
            {/* Animated pizza illustration */}
            <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/10" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-orange-500/10" />
              <span className="relative text-7xl">🛒</span>
            </div>

            <h2 className="text-3xl font-black">Your cart is empty</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              Looks like you haven't added anything yet. Start with a chef special and customize it exactly the way you like!
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-8 py-4 font-black shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity"
              >
                🍕 Browse Pizzas
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-8 py-4 font-bold hover:bg-white/[0.1] transition-colors"
              >
                View Menu
              </Link>
            </div>

            {/* Fun suggestions */}
            {/* Why order section */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-xs font-bold text-white">Fast Delivery</p>
                <p className="text-xs text-slate-400 mt-1">30 mins or less</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <div className="text-2xl mb-2">🍕</div>
                <p className="text-xs font-bold text-white">Fresh & Hot</p>
                <p className="text-xs text-slate-400 mt-1">Made to order</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-xs font-bold text-white">Free Delivery</p>
                <p className="text-xs text-slate-400 mt-1">Orders above ₹499</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
            <section className="space-y-5">
              {items.map((item) => (
                <article
                  key={item._id}
                  className={`grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 md:grid-cols-[9rem_1fr_auto] transition-all duration-300
                    ${removingId === item._id ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                    ${updatedId === item._id ? "border-orange-500/50 bg-orange-500/5" : ""}
                  `}
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"}
                    alt={item.name}
                    className="h-36 w-full rounded-3xl object-cover md:w-36"
                  />

                  <div>
                    <h2 className="text-2xl font-black">{item.name}</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.size?.name} • {item.crust?.name}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.toppings?.length ? (
                        item.toppings.map((topping) => (
                          <span key={topping._id || topping.name} className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-100">
                            {topping.name}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">No extra toppings</span>
                      )}
                    </div>
                    <p className="mt-4 font-bold text-orange-200">{formatCurrency(item.price)} each</p>
                  </div>

                  <div className="flex flex-row items-center justify-between gap-5 md:flex-col md:items-end">
                    {/* Quantity selector */}
                    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-black/25 overflow-hidden">
                      <button
                        onClick={() => changeQty(item._id, item.qty - 1)}
                        className="px-4 py-3 text-xl font-black hover:bg-red-500/20 transition-colors"
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={`min-w-12 text-center text-lg font-bold transition-all duration-200 ${updatedId === item._id ? "text-orange-400 scale-125" : ""}`}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => changeQty(item._id, item.qty + 1)}
                        className="px-4 py-3 text-xl font-black hover:bg-green-500/20 transition-colors"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black">{formatCurrency(item.price * item.qty)}</p>
                      <button
                        onClick={() => changeQty(item._id, 0)}
                        className="mt-2 text-sm font-semibold text-red-300 hover:text-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {/* Continue shopping link */}
              <div className="pt-2 text-center">
                <Link to="/" className="text-sm text-slate-400 hover:text-orange-300 transition-colors">
                  ← Continue Shopping
                </Link>
              </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur lg:sticky lg:top-24">
              <h2 className="text-2xl font-black">Order summary</h2>

              {/* Item breakdown */}
              <div className="mt-4 space-y-2 border-b border-white/10 pb-4">
                {items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm text-slate-400">
                    <span>{item.name} × {item.qty}</span>
                    <span>{formatCurrency(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-4 text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? "text-green-400" : ""}>
                    {deliveryFee ? formatCurrency(deliveryFee) : "Free 🎉"}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-orange-300">
                    Add {formatCurrency(499 - subtotal)} more for free delivery!
                  </p>
                )}
                <div className="border-t border-white/10 pt-4 text-white">
                  <div className="flex justify-between text-2xl font-black">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="mt-7 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-4 font-black text-emerald-950 shadow-lg shadow-emerald-950/20 hover:opacity-90 transition-opacity"
              >
                Proceed to checkout →
              </button>
              <p className="mt-4 text-center text-xs text-slate-400">Free delivery on orders above ₹499.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;