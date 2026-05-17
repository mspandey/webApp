import { useSelector } from "react-redux";

export default function Wishlist() {
  const { wishlist = [] } = useSelector((state) => state.user || {});

  if (wishlist.length === 0) {
    return <p className="p-6 text-white">No wishlist items yet.</p>;
  }

  return (
    <div className="space-y-3 p-6 text-white">
      {wishlist.map((pizza) => (
        <div key={pizza._id || pizza.name} className="rounded-lg bg-gray-800 p-4">
          {pizza.name}
        </div>
      ))}
    </div>
  );
}
