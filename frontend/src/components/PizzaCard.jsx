import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/money";

function PizzaCard({ pizza }) {
  const lowestSize = pizza.sizes?.[0];

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-orange-300/50 hover:bg-white/[0.09]">
      <div className="relative h-56 overflow-hidden">
        <img
          src={pizza.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"}
          alt={pizza.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950 shadow-lg">
          Freshly baked
        </span>
        <p className="absolute bottom-4 left-4 rounded-2xl bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
          From {formatCurrency(pizza.basePrice + (lowestSize?.price || 0))}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-xl font-extrabold text-white">{pizza.name}</h3>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-300">{pizza.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-200">
          {(pizza.sizes || []).slice(0, 3).map((size) => (
            <span key={size.name} className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
              {size.name}
            </span>
          ))}
        </div>

        <Link
          to={`/pizza/${pizza._id}`}
          className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 font-bold text-white shadow-lg shadow-red-950/30 transition hover:from-red-400 hover:to-orange-400"
        >
          Customize Now →
        </Link>
      </div>
    </article>
  );
}

export default PizzaCard;
