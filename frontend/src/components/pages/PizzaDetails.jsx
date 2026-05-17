import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { demoToppings } from "../../features/pizza/demoData";
import { fetchPizzaById } from "../../features/pizza/pizzaService";
import { addItemToCart } from "../../features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { formatCurrency } from "../../utils/money";

function PizzaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const { isLoading: isCartLoading } = useSelector((s) => s.cart);

  const [pizza, setPizza] = useState(null);
  const [size, setSize] = useState(null);
  const [crust, setCrust] = useState(null);
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingDemoToppings, setUsingDemoToppings] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const pizzaData = await fetchPizzaById(id);
        if (!pizzaData) throw new Error("Pizza not found");

        setPizza(pizzaData);
        setSize(pizzaData.sizes?.[0] || null);
        setCrust(pizzaData.crusts?.[0] || null);

        try {
          const toppingRes = await api.get("/toppings");
          const liveToppings = toppingRes.data.data || [];
          setToppings(liveToppings.length ? liveToppings : demoToppings);
          setUsingDemoToppings(!liveToppings.length);
        } catch {
          setToppings(demoToppings);
          setUsingDemoToppings(true);
        }
      } catch (err) {
        setError(err.message || "Failed to load pizza data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const toggleTopping = (topping) => {
    setSelectedToppings((current) =>
      current.some((item) => item._id === topping._id)
        ? current.filter((item) => item._id !== topping._id)
        : [...current, topping]
    );
  };

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    const toppingTotal = selectedToppings.reduce((sum, topping) => sum + (Number(topping.price) || 0), 0);
    return (Number(pizza.basePrice) || 0) + (Number(size?.price) || 0) + (Number(crust?.price) || 0) + toppingTotal;
  }, [crust, pizza, selectedToppings, size]);

  const totalPrice = unitPrice * qty;

  const addToCartHandler = async () => {
    if (!user) return navigate("/login");
    if (!size || !crust) {
      setError("Please select size and crust before adding to cart.");
      return;
    }

    const item = {
      pizzaId: pizza._id,
      name: pizza.name,
      image: pizza.image,
      size,
      crust,
      toppings: selectedToppings,
      price: unitPrice,
      qty,
    };

    const result = await dispatch(addItemToCart(item));
    if (addItemToCart.fulfilled.match(result)) navigate("/cart");
    else setError(result.payload || "Unable to add item to cart.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080411] px-6 py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div className="h-96 animate-pulse rounded-[2rem] bg-white/10" />
          <div className="h-96 animate-pulse rounded-[2rem] bg-white/10" />
        </div>
      </div>
    );
  }

  if (error && !pizza) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080411] px-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center">
          <h1 className="text-3xl font-black">Pizza not found</h1>
          <p className="mt-3 text-slate-300">{error}</p>
          <Link to="/" className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold">
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-orange-200 hover:text-orange-100">
          ← Back to menu
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30">
            <div className="relative h-[30rem]">
              <img
                src={pizza.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"}
                alt={pizza.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-8">
                <span className="rounded-full bg-orange-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-950">
                  Custom pizza builder
                </span>
                <h1 className="mt-5 text-4xl font-black md:text-5xl">{pizza.name}</h1>
                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-200">{pizza.description}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-black/25 p-5">
              <div>
                <p className="text-sm text-slate-400">Base price</p>
                <p className="text-2xl font-black text-orange-200">{formatCurrency(pizza.basePrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Unit total</p>
                <p className="text-2xl font-black text-emerald-300">{formatCurrency(unitPrice)}</p>
              </div>
            </div>

            {error && <p className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}
            {usingDemoToppings && <p className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">Showing demo toppings until live toppings are available.</p>}

            <div className="space-y-7">
              <div>
                <h2 className="text-lg font-black">1. Choose size</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(pizza.sizes || []).map((option) => (
                    <button
                      key={option.name}
                      onClick={() => setSize(option)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        size?.name === option.name
                          ? "border-orange-300 bg-orange-400/20 shadow-lg shadow-orange-950/20"
                          : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                      }`}
                    >
                      <span className="block font-bold">{option.name}</span>
                      <span className="mt-1 block text-sm text-slate-300">+{formatCurrency(option.price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black">2. Pick your crust</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {(pizza.crusts || []).map((option) => (
                    <button
                      key={option.name}
                      onClick={() => setCrust(option)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        crust?.name === option.name
                          ? "border-orange-300 bg-orange-400/20 shadow-lg shadow-orange-950/20"
                          : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                      }`}
                    >
                      <span className="block font-bold">{option.name}</span>
                      <span className="mt-1 block text-sm text-slate-300">+{formatCurrency(option.price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black">3. Add toppings</h2>
                <div className="mt-3 grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {toppings.map((topping) => {
                    const active = selectedToppings.some((item) => item._id === topping._id);
                    return (
                      <button
                        key={topping._id}
                        onClick={() => toggleTopping(topping)}
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-emerald-300 bg-emerald-400/15"
                            : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                        }`}
                      >
                        <span className="font-semibold">{topping.name}</span>
                        <span className="text-sm text-slate-300">+{formatCurrency(topping.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl bg-black/25 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Quantity</p>
                  <div className="mt-2 inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.06]">
                    <button onClick={() => setQty((value) => Math.max(1, value - 1))} className="px-4 py-3 text-xl font-black">−</button>
                    <span className="min-w-12 text-center text-lg font-bold">{qty}</span>
                    <button onClick={() => setQty((value) => Math.min(10, value + 1))} className="px-4 py-3 text-xl font-black">+</button>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-400">Cart total</p>
                  <p className="text-4xl font-black text-orange-200">{formatCurrency(totalPrice)}</p>
                </div>
              </div>

              <button
                onClick={addToCartHandler}
                disabled={isCartLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-7 py-4 text-lg font-black shadow-xl shadow-red-950/30 transition hover:from-red-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCartLoading ? "Adding..." : "Add to Cart 🛒"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PizzaDetails;
