import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, removeItem, updateCartItemQty } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cart, isLoading, isError, message } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) dispatch(fetchCart());
  }, [dispatch, user]);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  const changeQty = (id, nextQty) => {
    if (nextQty < 1) return dispatch(removeItem(id));
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
            <h1 className="mt-2 text-4xl font-black">Review your order</h1>
            <p className="mt-3 text-slate-400">Update quantities, remove items, and continue to checkout.</p>
          </div>
          <Link to="/" className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-center font-bold hover:bg-white/[0.1]">
            Add more pizza
          </Link>
        </div>

        {isError && <p className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-100">{message}</p>}

        {items.length === 0 ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-10 text-center shadow-2xl shadow-black/20">
            <div className="text-7xl">🛒</div>
            <h2 className="mt-5 text-3xl font-black">Your cart is empty</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">Start with a chef special and customize it exactly the way you like.</p>
            <Link to="/" className="mt-7 inline-flex rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-7 py-4 font-black">
              Browse menu
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
            <section className="space-y-5">
              {items.map((item) => (
                <article key={item._id} className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 md:grid-cols-[9rem_1fr_auto]">
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
                    <div className="inline-flex items-center rounded-2xl border border-white/10 bg-black/25">
                      <button onClick={() => changeQty(item._id, item.qty - 1)} className="px-4 py-3 text-xl font-black">−</button>
                      <span className="min-w-12 text-center text-lg font-bold">{item.qty}</span>
                      <button onClick={() => changeQty(item._id, item.qty + 1)} className="px-4 py-3 text-xl font-black">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{formatCurrency(item.price * item.qty)}</p>
                      <button onClick={() => dispatch(removeItem(item._id))} className="mt-2 text-sm font-semibold text-red-300 hover:text-red-200">
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur lg:sticky lg:top-24">
              <h2 className="text-2xl font-black">Order summary</h2>
              <div className="mt-6 space-y-4 text-slate-300">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee ? formatCurrency(deliveryFee) : "Free"}</span></div>
                <div className="border-t border-white/10 pt-4 text-white">
                  <div className="flex justify-between text-2xl font-black"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
                </div>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                className="mt-7 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-4 font-black text-emerald-950 shadow-lg shadow-emerald-950/20"
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
