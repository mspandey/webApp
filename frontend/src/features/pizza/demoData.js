export const demoPizzas = [
  {
    _id: "demo-margherita",
    name: "Classic Margherita",
    description: "San Marzano tomato sauce, fresh mozzarella, basil leaves, and extra virgin olive oil.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=1200&q=80",
    basePrice: 199,
    sizes: [
      { name: "Personal", price: 0 },
      { name: "Medium", price: 90 },
      { name: "Large", price: 170 },
    ],
    crusts: [
      { name: "Hand Tossed", price: 0 },
      { name: "Thin Crust", price: 35 },
      { name: "Cheese Burst", price: 85 },
    ],
    isAvailable: true,
  },
  {
    _id: "demo-farmhouse",
    name: "Farmhouse Feast",
    description: "Loaded with mushrooms, onion, capsicum, sweet corn, olives, and melty cheese.",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80",
    basePrice: 289,
    sizes: [
      { name: "Personal", price: 0 },
      { name: "Medium", price: 110 },
      { name: "Large", price: 210 },
    ],
    crusts: [
      { name: "Hand Tossed", price: 0 },
      { name: "Wheat Thin", price: 45 },
      { name: "Cheese Burst", price: 90 },
    ],
    isAvailable: true,
  },
  {
    _id: "demo-paneer",
    name: "Tandoori Paneer",
    description: "Spiced paneer tikka, red paprika, onion, coriander, and creamy tandoori sauce.",
    image: "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=1200&q=80",
    basePrice: 329,
    sizes: [
      { name: "Personal", price: 0 },
      { name: "Medium", price: 120 },
      { name: "Large", price: 230 },
    ],
    crusts: [
      { name: "Hand Tossed", price: 0 },
      { name: "Thin Crust", price: 40 },
      { name: "Cheese Burst", price: 95 },
    ],
    isAvailable: true,
  },
];

export const demoToppings = [
  { _id: "top-extra-cheese", name: "Extra Cheese", price: 55, isAvailable: true },
  { _id: "top-jalapeno", name: "Jalapeño", price: 35, isAvailable: true },
  { _id: "top-paneer", name: "Paneer Cubes", price: 65, isAvailable: true },
  { _id: "top-olives", name: "Black Olives", price: 45, isAvailable: true },
  { _id: "top-corn", name: "Sweet Corn", price: 35, isAvailable: true },
  { _id: "top-mushroom", name: "Mushroom", price: 45, isAvailable: true },
];
