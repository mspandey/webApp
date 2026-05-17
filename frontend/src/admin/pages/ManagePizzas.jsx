import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function ManagePizzas() {
  const { user } = useSelector((s) => s.auth);
  const token = user?.token;

  const [pizzas, setPizzas] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [sizes, setSizes] = useState([]);
  const [crusts, setCrusts] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  const [loading, setLoading] = useState(false);

  const fetchPizzas = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/pizzas`);
    setPizzas(res.data.data);
  };

  useEffect(() => {
    fetchPizzas();
  }, []);

  const addOption = (type) => {
    const option = { name: "", price: 0 };
    if (type === "size") setSizes([...sizes, option]);
    if (type === "crust") setCrusts([...crusts, option]);
  };

  const updateOption = (type, index, field, value) => {
    const list = type === "size" ? [...sizes] : [...crusts];
    list[index][field] = value;
    type === "size" ? setSizes(list) : setCrusts(list);
  };

  const removeOption = (type, index) => {
    const list = type === "size" ? [...sizes] : [...crusts];
    list.splice(index, 1);
    type === "size" ? setSizes(list) : setCrusts(list);
  };

  const addPizza = async () => {
    if (!name || !basePrice) {
      alert("Name and base price required");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/pizzas`,
        {
          name,
          description,
          image,
          basePrice: Number(basePrice),
          sizes,
          crusts,
          isAvailable,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setName("");
      setDescription("");
      setImage("");
      setBasePrice("");
      setSizes([]);
      setCrusts([]);
      setIsAvailable(true);

      fetchPizzas();
    } catch {
      alert("Failed to add pizza");
    } finally {
      setLoading(false);
    }
  };

  const deletePizza = async (id) => {
    if (!window.confirm("Delete pizza?")) return;

    await axios.delete(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/pizzas/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchPizzas();
  };

  return (
    <div className="text-white">

      <h2 className="text-2xl font-bold mb-4">Manage Pizzas 🍕</h2>

      {/* CREATE FORM */}
      <div className="bg-gray-800 p-5 rounded mb-8 max-w-3xl">

        <h3 className="font-semibold mb-3">Create New Pizza</h3>

        <div className="grid md:grid-cols-2 gap-3">

          <input placeholder="Name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 rounded text-black"/>

          <input placeholder="Image URL" value={image}
            onChange={(e) => setImage(e.target.value)}
            className="p-2 rounded text-black"/>

          <input placeholder="Base Price" type="number" value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="p-2 rounded text-black"/>

          <textarea placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 rounded text-black"/>

        </div>

        {/* Sizes */}
        <div className="mt-4">
          <h4 className="font-semibold">Sizes</h4>
          {sizes.map((s, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <input placeholder="Name" className="text-black p-1"
                onChange={(e) => updateOption("size", i, "name", e.target.value)} />
              <input placeholder="Price" type="number" className="text-black p-1"
                onChange={(e) => updateOption("size", i, "price", e.target.value)} />
              <button onClick={() => removeOption("size", i)} className="text-red-400">✕</button>
            </div>
          ))}
          <button onClick={() => addOption("size")} className="mt-2 text-sm text-green-400">
            + Add Size
          </button>
        </div>

        {/* Crusts */}
        <div className="mt-4">
          <h4 className="font-semibold">Crusts</h4>
          {crusts.map((c, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <input placeholder="Name" className="text-black p-1"
                onChange={(e) => updateOption("crust", i, "name", e.target.value)} />
              <input placeholder="Price" type="number" className="text-black p-1"
                onChange={(e) => updateOption("crust", i, "price", e.target.value)} />
              <button onClick={() => removeOption("crust", i)} className="text-red-400">✕</button>
            </div>
          ))}
          <button onClick={() => addOption("crust")} className="mt-2 text-sm text-green-400">
            + Add Crust
          </button>
        </div>

        {/* Availability */}
        <div className="mt-4 flex items-center gap-2">
          <input type="checkbox" checked={isAvailable}
            onChange={() => setIsAvailable(!isAvailable)} />
          <span>Available</span>
        </div>

        <button
          onClick={addPizza}
          disabled={loading}
          className="mt-4 bg-red-600 px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Create Pizza"}
        </button>

      </div>

      {/* PIZZA LIST */}
      <div className="space-y-3">
        {pizzas.map((p) => (
          <div key={p._id} className="bg-gray-800 p-3 rounded flex justify-between">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm">₹{p.basePrice}</p>
              <p className="text-xs text-gray-400">
                {p.isAvailable ? "Available" : "Unavailable"}
              </p>
            </div>

            <button onClick={() => deletePizza(p._id)} className="text-red-400">
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
