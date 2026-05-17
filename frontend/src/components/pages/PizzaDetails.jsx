import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api/axios";
import { demoToppings } from "../../features/pizza/demoData";
import { fetchPizzaById } from "../../features/pizza/pizzaService";
import { addItemToCart } from "../../features/cart/cartSlice";
import { formatCurrency } from "../../utils/money";


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
    if (id?.startsWith("demo-")) return setReviewError("Demo pizzas cannot save live reviews. Add this pizza from admin first.");
    if (!reviewComment.trim() || reviewComment.trim().length < 3) return setReviewError("Please write at least 3 characters in your review.");

    try {
      setReviewLoading(true);
      setReviewError("");
      setReviewSuccess("");
      const res = await api.post(`/pizzas/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setPizza(res.data.data);
      setReviewComment("");
      setReviewSuccess(res.data.message || "Review saved successfully.");
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to save review.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen px-6 py-20 text-white">Loading...</div>;
  if (error) return <div className="min-h-screen px-6 py-20 text-red-300">{error}</div>;
  if (!pizza) return null;

  return (
    <div className="min-h-screen px-6 py-10 text-white">
      <Link to="/menu" className="text-orange-300">← Back to menu</Link>
      <h1 className="mt-4 text-3xl font-bold">{pizza.name}</h1>
      <p className="text-slate-300">{pizza.description}</p>
      <p className="mt-2">{renderStars(averageRating)} ({reviews.length})</p>
      <p className="mt-3">Total: {formatCurrency(totalPrice)}</p>
      {usingDemoToppings && <p className="text-amber-300">Using demo toppings</p>}
      <button onClick={addToCartHandler} disabled={isCartLoading} className="mt-4 rounded bg-orange-500 px-4 py-2">
        {isCartLoading ? "Adding..." : "Add to Cart"}
      </button>

      <form onSubmit={submitReview} className="mt-8 space-y-2">
        <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="w-full rounded p-2 text-black" placeholder="Write review" />
        <button disabled={reviewLoading} className="rounded bg-sky-500 px-4 py-2">Submit Review</button>
        {reviewError && <p className="text-red-300">{reviewError}</p>}
        {reviewSuccess && <p className="text-emerald-300">{reviewSuccess}</p>}
      </form>

      <div className="mt-6">
        {toppings.map((t) => (
          <button key={t._id || t.name} onClick={() => toggleTopping(t)} className="mr-2 mt-2 rounded border px-2 py-1">
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PizzaDetails;
