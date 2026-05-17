import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function ManageToppings() {
  const [toppings, setToppings] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useSelector((s) => s.auth);

  const token = user?.token;

  const fetchToppings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/toppings`);
      setToppings(res.data.data);
    } catch {
      setError("Failed to load toppings");
    }
  };

  useEffect(() => {
    fetchToppings();
  }, []);

  const addTopping = async () => {
    if (!name || !price) {
      alert("Enter name and price");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/toppings`,
        { name, price },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setName("");
      setPrice("");
      fetchToppings();
    } catch {
      alert("Failed to add topping");
    } finally {
      setLoading(false);
    }
  };

  const deleteTopping = async (id) => {
    if (!window.confirm("Delete this topping?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/toppings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchToppings();
    } catch {
      alert("Failed to delete topping");
    }
  };

  return (
    <div className="text-white">

      <h2 className="text-2xl font-bold mb-6">Manage Toppings 🧀</h2>

      {/* Add topping form */}
      <div className="bg-gray-800 p-4 rounded mb-6 max-w-md">
        <h3 className="font-semibold mb-3">Add New Topping</h3>

        <input
          type="text"
          placeholder="Topping name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 mb-2 rounded text-black"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-2 mb-3 rounded text-black"
        />

        <button
          onClick={addTopping}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          {loading ? "Adding..." : "Add Topping"}
        </button>
      </div>

      {/* Toppings list */}
      <div className="space-y-3">
        {error && <p className="text-red-400">{error}</p>}

        {toppings.map((t) => (
          <div
            key={t._id}
            className="bg-gray-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-400">₹{t.price}</p>
            </div>

            <button
              onClick={() => deleteTopping(t._id)}
              className="text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
