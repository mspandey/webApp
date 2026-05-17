import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";

export default function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
      isActive
        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-950/30"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#080411] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(248,113,22,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_30%)]" />

      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-white/10 bg-black/30 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:flex">
        <Link to="/admin/dashboard" className="mb-8 flex items-center gap-3 text-xl font-black">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-2xl">🍕</span>
          <span>PizzaCraft Pro</span>
        </Link>

        <nav className="space-y-2">
          <NavLink to="/admin/dashboard" className={linkClass}>📊 Dashboard</NavLink>
          <NavLink to="/admin/orders" className={linkClass}>📦 Orders</NavLink>
          <NavLink to="/admin/pizzas" className={linkClass}>🍕 Pizzas</NavLink>
          <NavLink to="/admin/toppings" className={linkClass}>🧀 Toppings</NavLink>
          <NavLink to="/admin/users" className={linkClass}>👥 Users</NavLink>
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">Admin</p>
          <p className="mt-1 font-black">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <button onClick={handleLogout} className="mt-4 w-full rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100 hover:bg-red-500/20">
            Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080411]/90 px-4 py-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link to="/admin/dashboard" className="font-black">🍕 PizzaCraft Pro</Link>
          <button onClick={handleLogout} className="rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-100">Logout</button>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/orders" className={linkClass}>Orders</NavLink>
          <NavLink to="/admin/pizzas" className={linkClass}>Pizzas</NavLink>
          <NavLink to="/admin/toppings" className={linkClass}>Toppings</NavLink>
          <NavLink to="/admin/users" className={linkClass}>Users</NavLink>
        </nav>
      </header>

      <main className="p-4 sm:p-6 lg:ml-72 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
