import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) => s.cart.cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0);

  const linkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-950/30" : "text-slate-200 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080411]/85 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 shadow-lg shadow-red-950/30">🍕</span>
          <span>PizzaCraft</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={linkClass}>Menu</NavLink>
          {user && <NavLink to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} className={linkClass}>Dashboard</NavLink>}
          {user && user.role !== "admin" && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative rounded-full border border-white/10 bg-white/10 px-4 py-2 font-bold transition hover:bg-white/15">
            🛒 Cart
            {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-orange-400 px-1 text-xs font-black text-orange-950">{cartCount}</span>}
          </Link>

          {!user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/10">Login</Link>
              <Link to="/register" className="rounded-full bg-white px-5 py-2 text-sm font-black text-slate-950 hover:bg-orange-100">Register</Link>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-slate-300">Hi, <b className="text-white">{user.name}</b></span>
              <button onClick={handleLogout} className="rounded-full border border-red-300/20 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/10">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
