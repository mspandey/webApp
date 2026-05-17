import { Link } from "react-router-dom";
import { getPizzas } from "../../features/pizza/pizzaSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import PizzaCard from "../PizzaCard";

function HomePage() {
  const dispatch = useDispatch();
  const { pizzas, isLoading, message, usingDemoMenu } = useSelector((s) => s.pizza);
  const { user } = useSelector((s) => s.auth);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(getPizzas());
  }, [dispatch]);

  const filteredPizzas = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pizzas;
    return pizzas.filter((pizza) =>
      [pizza.name, pizza.description].some((value) => value?.toLowerCase().includes(term))
    );
  }, [pizzas, query]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080411] text-white">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(248,113,22,0.35),transparent_30%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.28),transparent_28%),linear-gradient(135deg,#120714_0%,#1f1029_45%,#07040d_100%)]" />
        <div className="absolute left-1/2 top-16 -z-10 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <span className="inline-flex rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-100 shadow-lg shadow-orange-950/30">
              🔥 Live pizza builder • fresh dough daily
            </span>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Design your perfect pizza in minutes.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Choose the base, crust, size, premium toppings, and checkout securely. A professional ordering flow built for fast customization and smooth delivery.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#menu"
                className="rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-7 py-4 text-center font-bold shadow-xl shadow-red-950/40 transition hover:scale-[1.02] hover:from-red-400 hover:to-orange-400"
              >
                Start Customizing
              </a>
              {!user && (
                <Link
                  to="/register"
                  className="rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-center font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Create Account
                </Link>
              )}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:max-w-xl">
              {[
                ["4.8★", "Customer rating"],
                ["30 min", "Avg. delivery"],
                ["100%", "Customizable"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <p className="text-2xl font-black text-orange-200">{value}</p>
                  <p className="mt-1 text-xs text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-orange-500/30 to-red-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img
                src="https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=85"
                alt="Hot customized pizza"
                className="h-[28rem] w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-3xl border border-white/10 bg-black/55 p-5 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.25em] text-orange-200">Today’s favourite</p>
                <h2 className="mt-2 text-2xl font-black">Cheese Burst Tandoori Paneer</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">Menu</p>
            <h2 className="mt-2 text-4xl font-black">Popular pizzas</h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Pick a recipe, then personalize every layer on the next screen.
            </p>
          </div>
          <div className="w-full md:w-80">
            <label className="sr-only" htmlFor="pizza-search">Search pizzas</label>
            <input
              id="pizza-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pizza..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-3 text-white outline-none ring-orange-400/40 placeholder:text-slate-500 focus:ring-4"
            />
          </div>
        </div>

        {(usingDemoMenu || message) && (
          <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
            {message || "Demo menu is active until live pizzas are added by the admin."}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-3xl bg-white/10" />
            ))}
          </div>
        )}

        {!isLoading && filteredPizzas.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-10 text-center text-slate-300">
            No pizzas matched your search. Try “paneer”, “farmhouse”, or clear the search.
          </div>
        )}

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPizzas.map((pizza) => (
            <PizzaCard key={pizza._id} pizza={pizza} />
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.04] py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
          {[
            ["🍕", "Real customization", "Sizes, crusts, toppings, quantity, and cart totals update instantly."],
            ["🧾", "Clean checkout", "Address validation, COD option, and Razorpay online payment support."],
            ["🚚", "Order ready flow", "Orders are stored with full item configurations for kitchen and delivery tracking."],
          ].map(([icon, title, copy]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-[#120a1d] p-7 shadow-xl shadow-black/20">
              <div className="text-4xl">{icon}</div>
              <h3 className="mt-5 text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HomePage;
