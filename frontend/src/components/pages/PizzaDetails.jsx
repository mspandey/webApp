import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import api from "../../api/axios";
import { demoToppings } from "../../features/pizza/demoData";
import { fetchPizzaById } from "../../features/pizza/pizzaService";
import { addItemToCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";

const renderStars = (rating = 0) =>
  Array.from({ length: 5 }, (_, index) =>
    index < Math.round(rating) ? "★" : "☆"
  ).join("");

function PizzaDetails() {
  const { id } = useParams();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { isLoading: isCartLoading } = useSelector(
    (state) => state.cart
  );

  const [pizza, setPizza] = useState(null);

  const [size, setSize] = useState(null);
  const [crust, setCrust] = useState(null);

  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);

  const [qty, setQty] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [usingDemoToppings, setUsingDemoToppings] =
    useState(false);

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewComment, setReviewComment] = useState("");

  const [reviewError, setReviewError] = useState("");

  const [reviewSuccess, setReviewSuccess] = useState("");

  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        setError("");

        const pizzaData = await fetchPizzaById(id);

        if (!pizzaData) {
          throw new Error("Pizza not found");
        }

        setPizza(pizzaData);

        setSize(pizzaData.sizes?.[0] || null);

        setCrust(pizzaData.crusts?.[0] || null);

        try {
          const toppingRes = await api.get("/toppings");

          const liveToppings = toppingRes.data.data || [];

          setToppings(
            liveToppings.length
              ? liveToppings
              : demoToppings
          );

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
        ? current.filter(
            (item) => item._id !== topping._id
          )
        : [...current, topping]
    );
  };

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;

    const toppingTotal = selectedToppings.reduce(
      (sum, topping) =>
        sum + (Number(topping.price) || 0),
      0
    );

    return (
      (Number(pizza.basePrice) || 0) +
      (Number(size?.price) || 0) +
      (Number(crust?.price) || 0) +
      toppingTotal
    );
  }, [pizza, size, crust, selectedToppings]);

  const totalPrice = unitPrice * qty;

  const reviews = pizza?.reviews || [];

  const averageRating = Number(pizza?.rating || 0);

  const addToCartHandler = async () => {
    if (!user) {
      return navigate("/login");
    }

    if (!size || !crust) {
      setError(
        "Please select size and crust before adding to cart."
      );

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

    if (addItemToCart.fulfilled.match(result)) {
      navigate("/cart");
    } else {
      setError(
        result.payload || "Unable to add item to cart."
      );
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!user) {
      return navigate("/login");
    }

    if (id?.startsWith("demo-")) {
      setReviewError(
        "Demo pizzas cannot save live reviews. Add this pizza from admin first."
      );

      return;
    }

    if (
      !reviewComment.trim() ||
      reviewComment.trim().length < 3
    ) {
      setReviewError(
        "Please write at least 3 characters in your review."
      );

      return;
    }

    try {
      setReviewLoading(true);

      setReviewError("");

      setReviewSuccess("");

      const res = await api.post(
        `/pizzas/${id}/reviews`,
        {
          rating: reviewRating,
          comment: reviewComment,
        }
      );

      setPizza(res.data.data);

      setReviewComment("");

      setReviewSuccess(
        res.data.message || "Review saved successfully."
      );
    } catch (err) {
      setReviewError(
        err.response?.data?.error ||
          "Failed to save review."
      );
    } finally {
      setReviewLoading(false);
    }
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
          <h1 className="text-3xl font-black">
            Pizza not found
          </h1>

          <p className="mt-3 text-slate-300">{error}</p>

          <Link
            to="/"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className="text-sm font-semibold text-orange-200 hover:text-orange-100"
        >
          ← Back to menu
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30">
            <div className="relative h-[30rem]">
              <img
                src={
                  pizza.image ||
                  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
                }
                alt={pizza.name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

              <div className="absolute bottom-0 p-8">
                <span className="rounded-full bg-orange-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-orange-950">
                  Custom pizza builder
                </span>

                <h1 className="mt-5 text-4xl font-black md:text-5xl">
                  {pizza.name}
                </h1>

                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-200">
                  {pizza.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-2xl text-amber-300">
                    {renderStars(averageRating)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
                    {averageRating
                      ? averageRating.toFixed(1)
                      : "No rating"}{" "}
                    •{" "}
                    {pizza.numReviews || reviews.length}{" "}
                    reviews
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-black/25 p-5">
              <div>
                <p className="text-sm text-slate-400">
                  Base price
                </p>

                <p className="text-2xl font-black text-orange-200">
                  {formatCurrency(pizza.basePrice)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-400">
                  Unit total
                </p>

                <p className="text-2xl font-black text-emerald-300">
                  {formatCurrency(unitPrice)}
                </p>
              </div>
            </div>

            {error && (
              <p className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}

            {usingDemoToppings && (
              <p className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Showing demo toppings until live toppings
                are available.
              </p>
            )}

            <div className="space-y-7">
              <div>
                <h2 className="text-lg font-black">
                  1. Choose size
                </h2>

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
                      <span className="block font-bold">
                        {option.name}
                      </span>

                      <span className="mt-1 block text-sm text-slate-300">
                        +{formatCurrency(option.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black">
                  2. Pick your crust
                </h2>

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
                      <span className="block font-bold">
                        {option.name}
                      </span>

                      <span className="mt-1 block text-sm text-slate-300">
                        +{formatCurrency(option.price)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black">
                  3. Add toppings
                </h2>

                <div className="mt-3 grid max-h-64 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                  {toppings.map((topping) => {
                    const active =
                      selectedToppings.some(
                        (item) =>
                          item._id === topping._id
                      );

                    return (
                      <button
                        key={topping._id}
                        onClick={() =>
                          toggleTopping(topping)
                        }
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-emerald-300 bg-emerald-400/15"
                            : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                        }`}
                      >
                        <span className="font-semibold">
                          {topping.name}
                        </span>

                        <span className="text-sm text-slate-300">
                          +{formatCurrency(
                            topping.price
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl bg-black/25 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Quantity
                  </p>

                  <div className="mt-2 inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.06]">
                    <button
                      onClick={() =>
                        setQty((value) =>
                          Math.max(1, value - 1)
                        )
                      }
                      className="px-4 py-3 text-xl font-black"
                    >
                      −
                    </button>

                    <span className="min-w-12 text-center text-lg font-bold">
                      {qty}
                    </span>

                    <button
                      onClick={() =>
                        setQty((value) =>
                          Math.min(10, value + 1)
                        )
                      }
                      className="px-4 py-3 text-xl font-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-sm text-slate-400">
                    Cart total
                  </p>

                  <p className="text-4xl font-black text-orange-200">
                    {formatCurrency(totalPrice)}
                  </p>
                </div>
              </div>

              <button
                onClick={addToCartHandler}
                disabled={isCartLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-7 py-4 text-lg font-black shadow-xl shadow-red-950/30 transition hover:from-red-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCartLoading
                  ? "Adding..."
                  : "Add to Cart 🛒"}
              </button>
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300">
              Customer reviews
            </p>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-black">
                  {averageRating
                    ? averageRating.toFixed(1)
                    : "0.0"}
                </p>

                <p className="mt-2 text-2xl text-amber-300">
                  {renderStars(averageRating)}
                </p>

                <p className="mt-2 text-slate-400">
                  Based on{" "}
                  {pizza.numReviews ||
                    reviews.length}{" "}
                  reviews
                </p>
              </div>

              <div className="rounded-3xl bg-black/25 px-5 py-4 text-right">
                <p className="text-sm text-slate-400">
                  Taste confidence
                </p>

                <p className="text-2xl font-black text-emerald-300">
                  {averageRating >= 4
                    ? "Excellent"
                    : averageRating
                    ? "Good"
                    : "New"}
                </p>
              </div>
            </div>

            <form
              onSubmit={submitReview}
              className="mt-7 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200">
                  Your rating
                </label>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setReviewRating(rating)
                      }
                      className={`h-11 w-11 rounded-2xl border text-xl transition ${
                        reviewRating >= rating
                          ? "border-amber-300 bg-amber-300/20 text-amber-200"
                          : "border-white/10 bg-white/[0.06] text-slate-500"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewComment}
                onChange={(event) =>
                  setReviewComment(
                    event.target.value
                  )
                }
                placeholder="Share your taste, crust and topping experience..."
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-orange-400/40 placeholder:text-slate-500 focus:ring-4"
              />

              {reviewError && (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {reviewError}
                </p>
              )}

              {reviewSuccess && (
                <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {reviewSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={reviewLoading}
                className="w-full rounded-2xl border border-white/10 bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reviewLoading
                  ? "Saving review..."
                  : user
                  ? "Submit Review"
                  : "Login to Review"}
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 md:p-8">
            <h2 className="text-2xl font-black">
              What customers say
            </h2>

            <div className="mt-5 space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <article
                    key={
                      review._id ||
                      `${review.name}-${review.createdAt}`
                    }
                    className="rounded-3xl border border-white/10 bg-black/25 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {review.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {review.createdAt
                            ? new Date(
                                review.createdAt
                              ).toLocaleDateString()
                            : "Verified customer"}
                        </p>
                      </div>

                      <p className="text-xl text-amber-300">
                        {renderStars(review.rating)}
                      </p>
                    </div>

                    <p className="mt-4 leading-7 text-slate-300">
                      {review.comment}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center text-slate-400">
                  No reviews yet. Be the first customer to
                  review this pizza.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PizzaDetails;