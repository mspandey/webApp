import { Link, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";

function Header() {
  const dispatch = useDispatch();

  // 🔹 Redux state
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? "text-red-600" : "text-gray-700 hover:text-red-500"
    }`;

  const navigate = useNavigate();

const handleLogout = () => {
  dispatch(logout());
  navigate("/login");
};
  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* Logo */}
        <Link to="/pizzastore" className="text-xl font-extrabold text-red-600">
          🍕 PizzaApp
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <NavLink to="/pizzastore" className={linkClass}>
            Pizzas
          </NavLink>

          <NavLink to="/orders" className={linkClass}>
            Orders
          </NavLink>

          {/* Cart */}
          <Link to="/cart" className="relative text-sm font-medium text-gray-700">
            Cart
            {const cartItems = useSelector(
  (state) => state.cart.items || []
);(
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 rounded-full">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* Profile */}
          <NavLink to="/profile" className={linkClass}>
            {user?.name || "Profile"}
          </NavLink>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-red-600 hover:text-red-700"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
