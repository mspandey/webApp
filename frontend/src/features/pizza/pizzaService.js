import api from "../../api/axios";
import { demoPizzas } from "./demoData";

const shouldUseDemoData = () => import.meta.env.VITE_USE_DEMO_DATA === "true";

export const fetchPizzas = async () => {
  if (shouldUseDemoData()) return demoPizzas;

  const res = await api.get("/pizzas");
  const pizzas = res.data.data || [];
  return pizzas.length ? pizzas : demoPizzas;
};

export const fetchPizzaById = async (id) => {
  if (shouldUseDemoData() || id?.startsWith("demo-")) {
    return demoPizzas.find((pizza) => pizza._id === id);
  }

  const res = await api.get(`/pizzas/${id}`);
  return res.data.data;
};
