import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../../features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";
import PizzaVisualizer from "../components/PizzaVisualizer";
import { usePizzaDraft } from "../hooks/usePizzaDraft";
import { clearPizzaDraft } from "../hooks/usePizzaDraft";

function UserDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const PizzaCustomization = () => {
  usePizzaDraft();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Welcome, {user?.name} 🍕</h2>
            <p className="text-gray-400 mt-1">Manage your orders and account</p>
          </div>

          <div className="mt-4 md:mt-0 flex gap-3">
            <Link
              to="/"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
            >
              Browse Pizzas
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">

          <DashboardCard
            title="My Cart"
            desc="View items you added"
            link="/cart"
            icon="🛒"
          />

          <DashboardCard
            title="My Orders"
            desc="Track your past orders"
            link="/orders"
            icon="📦"
          />

          <DashboardCard
            title="My Profile"
            desc="Update your personal info"
            link="/profile"
            icon="👤"
          />

        </div>

        {/* Extra actions */}
        <div className="mt-10 bg-gray-800 p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/orders"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
            >
              Track Order
            </Link>

            <Link
              to="/cart"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
            >
              View Cart
            </Link>

            <Link
              to="/"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm"
            >
              Order Again
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

function DashboardCard({ title, desc, link, icon }) {
  return (
    <Link
      to={link}
      className="bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg hover:bg-gray-700 transition flex flex-col"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>

      <span className="mt-auto text-red-400 text-sm font-medium mt-4">
        Open →
      </span>
    </Link>
  );
}

export default UserDashboard;
