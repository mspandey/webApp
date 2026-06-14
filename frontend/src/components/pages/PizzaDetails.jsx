import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import { demoToppings } from "../../features/pizza/demoData";
import { fetchPizzaById } from "../../features/pizza/pizzaService";
import { addItemToCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";
import LoadingScreen from "../ui/LoadingScreen";

const renderStars = (rating = 0) =>
  Array.from({ length: 5 }, (_, index) => (index < Math.round(rating) ? "★" : "☆")).join("");

function PizzaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { isLoading: isCartLoading } = useSelector((state) => state.cart);

  const [pizza, setPizza] = useState(null);
  const [size, setSize] = useState(null);
  const [crust, setCrust] = useState(null);
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [qty, setQty] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingDemoToppings, setUsingDemoToppings] = useState(false);

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

  const isToppingSelected = (topping) =>
    selectedToppings.some((item) => (item._id || item.name) === (topping._id || topping.name));

  const toggleTopping = (topping) => {
    setSelectedToppings((current) =>
      current.some((item) => (item._id || item.name) === (topping._id || topping.name))
        ? current.filter((item) => (item._id || item.name) !== (topping._id || topping.name))
        : [...current, topping]
    );
  };

  const unitPrice = useMemo(() => {
    if (!pizza) return 0;
    const toppingTotal = selectedToppings.reduce((sum, topping) => sum + (Number(topping.price) || 0), 0);
    return (Number(pizza.basePrice) || 0) + (Number(size?.price) || 0) + (Number(crust?.price) || 0) + toppingTotal;
  }, [pizza, size, crust, selectedToppings]);

  const totalPrice = unitPrice * qty;
  const reviews = pizza?.reviews || [];
  const averageRating = Number(pizza?.rating || 0);

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

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) return navigate("/login");
    if (id?.startsWith("demo-"))
      return setReviewError("Demo pizzas cannot save live reviews. Add this pizza from admin first.");
    if (!reviewComment.trim() || reviewComment.trim().length < 3)
      return setReviewError("Please write at least 3 characters in your review.");

    try {
      setReviewLoading(true);
      setReviewError("");
      setReviewSuccess("");
      const res = await api.post(`/pizzas/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setPizza(res.data.data);
      setReviewComment("");
      setReviewRating(5);
      setReviewSuccess(res.data.message || "Review saved successfully.");
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to save review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading)
    return (
      <LoadingScreen
        title="Loading pizza details"
        description="Preparing sizes, crust options, toppings, and reviews for this pizza."
        className="bg-[#080411] text-white"
      />
    );
  if (error && !pizza)
    return <div className="min-h-screen bg-[#080411] px-6 py-20 text-red-300">{error}</div>;
  if (!pizza) return null;

  const optionButton = (active) =>
    `rounded-xl border px-4 py-2 text-sm font-medium transition ${
      active
        ? "border-orange-400 bg-orange-500/20 text-orange-100"
        : "border-white/15 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="text-sm text-orange-300 hover:text-orange-200">
          ← Back to menu
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
          {/* Left: image + summary */}
          <div>
            {pizza.image && (
              <img
                src={pizza.image}
                alt={pizza.name}
                className="aspect-square w-full rounded-2xl object-cover"
              />
            )}
            <h1 className="mt-5 text-3xl font-bold">{pizza.name}</h1>
            <p className="mt-2 text-slate-300">{pizza.description}</p>
            <p className="mt-3 text-amber-300">
              {renderStars(averageRating)}{" "}
              <span className="text-slate-400">
                ({averageRating.toFixed(1)} · {reviews.length} reviews)
              </span>
            </p>
          </div>

          {/* Right: customization */}
          <div className="space-y-6">
            {/* Size */}
            {pizza.sizes?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pizza.sizes.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setSize(option)}
                      className={optionButton(size?.name === option.name)}
                    >
                      {option.name}
                      {option.price > 0 && (
                        <span className="ml-1 text-slate-400">+{formatCurrency(option.price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crust */}
            {pizza.crusts?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Crust
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pizza.crusts.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setCrust(option)}
                      className={optionButton(crust?.name === option.name)}
                    >
                      {option.name}
                      {option.price > 0 && (
                        <span className="ml-1 text-slate-400">+{formatCurrency(option.price)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings (multi-select) */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Toppings{" "}
                <span className="font-normal lowercase text-slate-500">(select any)</span>
              </h3>
              {usingDemoToppings && (
                <p className="mb-2 text-xs text-amber-300">Showing demo toppings</p>
              )}
              <div className="flex flex-wrap gap-2">
                {toppings.map((topping) => {
                  const active = isToppingSelected(topping);
                  return (
                    <button
                      key={topping._id || topping.name}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      className={optionButton(active)}
                    >
                      <span className="mr-1">{active ? "✓" : "+"}</span>
                      {topping.name}
                      <span className="ml-1 text-slate-400">
                        {formatCurrency(topping.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Quantity
              </h3>
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-7 w-7 rounded-lg bg-white/10 text-lg leading-none hover:bg-white/20"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="h-7 w-7 rounded-lg bg-white/10 text-lg leading-none hover:bg-white/20"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total + Add to cart */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Total</span>
                <span className="text-2xl font-bold text-orange-300">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {formatCurrency(unitPrice)} each × {qty}
              </p>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <button
                onClick={addToCartHandler}
                disabled={isCartLoading}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 font-bold transition hover:from-red-400 hover:to-orange-400 disabled:opacity-60"
              >
                {isCartLoading ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold">Reviews</h2>

          <form
            onSubmit={submitReview}
            className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div>
              <span className="mb-1 block text-sm text-slate-300">Your rating</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl leading-none transition ${
                      star <= reviewRating ? "text-amber-400" : "text-slate-600 hover:text-slate-400"
                    }`}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-white/10 bg-white/90 p-3 text-black placeholder:text-slate-500"
              placeholder="Share what you thought about this pizza..."
            />
            <div className="flex items-center gap-3">
              <button
                disabled={reviewLoading}
                className="rounded-xl bg-sky-500 px-5 py-2 font-semibold transition hover:bg-sky-400 disabled:opacity-60"
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
              {reviewError && <p className="text-sm text-red-300">{reviewError}</p>}
              {reviewSuccess && <p className="text-sm text-emerald-300">{reviewSuccess}</p>}
            </div>
          </form>

          {/* Existing reviews */}
          <div className="mt-6 space-y-4">
            {reviews.length === 0 && (
              <p className="text-slate-400">No reviews yet. Be the first to review!</p>
            )}
            {reviews.map((review) => (
              <div
                key={review._id || `${review.name}-${review.createdAt}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{review.name}</span>
                  <span className="text-amber-400">{renderStars(review.rating)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PizzaDetails;