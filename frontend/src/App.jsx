import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Layouts
import Layout from "./layouts/PublicLayout";
import AdminLayout from "./admin/pages/AdminLayout";

// Public pages
import HomePage from "./components/pages/HomePage";
import PizzaDetails from "./components/pages/PizzaDetails";

// Auth pages
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";

// User pages
import UserDashboard from "./user/pages/UserDashboard";
import Cart from "./components/pages/Cart";
import Checkout from "./components/pages/Checkout";
import Orders from "./components/pages/Orders";
import OrderDetails from "./user/pages/OrderDetails";
import Profile from "./user/pages/Profile";
import AddressBook from "./user/pages/AddressBook";
import Wishlist from "./user/pages/Wishlist";
import Notifications from "./user/pages/Notifications";

// Admin pages
import AdminDashboard from "./admin/pages/AdminDashboard";
import ManagePizzas from "./admin/pages/ManagePizzas";
import ManageToppings from "./admin/pages/ManageToppings";
import ManageOrders from "./admin/pages/ManageOrders";
import ManageUsers from "./admin/pages/ManageUsers";
import ManageCoupons from "./admin/pages/ManageCoupons";

// Auth guard
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Routes>

      {/* ================= PUBLIC LAYOUT ================= */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="pizza/:id" element={<PizzaDetails />} />

        {/* User shopping flow */}
        <Route path="cart" element={
          <ProtectedRoute role="user">
            <Cart />
          </ProtectedRoute>
        }/>

        <Route path="checkout" element={
          <ProtectedRoute role="user">
            <Checkout />
          </ProtectedRoute>
        }/>

        <Route path="orders" element={
          <ProtectedRoute role="user">
            <Orders />
          </ProtectedRoute>
        }/>

        <Route path="orders/:id" element={
          <ProtectedRoute role="user">
            <OrderDetails />
          </ProtectedRoute>
        }/>

        <Route path="profile" element={
          <ProtectedRoute role="user">
            <Profile />
          </ProtectedRoute>
        }/>

        <Route path="addresses" element={
          <ProtectedRoute role="user">
            <AddressBook />
          </ProtectedRoute>
        }/>

        <Route path="wishlist" element={
          <ProtectedRoute role="user">
            <Wishlist />
          </ProtectedRoute>
        }/>

        <Route path="notifications" element={
          <ProtectedRoute role="user">
            <Notifications />
          </ProtectedRoute>
        }/>
      </Route>

      {/* ================= AUTH ROUTES ================= */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} />
            : <Login />
        }
      />
<Route
  path="/register"
  element={
    user
      ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
      : <Register />
  }
/>
     

      {/* ================= USER DASHBOARD ================= */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN SECTION (WITH LAYOUT) ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="pizzas" element={<ManagePizzas />} />
        <Route path="toppings" element={<ManageToppings />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="coupons" element={<ManageCoupons />} />
      </Route>

      {/* ================= FALLBACK ================= */}
     
<Route
  path="*"
  element={
    user
      ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
      : <Navigate to="/" replace />
  }
/>
    </Routes>
  );
}

export default App;
