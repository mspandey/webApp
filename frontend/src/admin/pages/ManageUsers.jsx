import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { user } = useSelector((s) => s.auth);
  const token = user?.token;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/user/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL||"http://localhost:5000/api"}/user/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadUsers();
    } catch {
      alert("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="text-white">Loading users...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="text-white">

      <h2 className="text-2xl font-bold mb-4">Manage Users 👥</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 rounded w-full max-w-md text-black"
      />

      <div className="space-y-3">

        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className="bg-gray-800 p-4 rounded flex justify-between items-center border border-gray-700"
          >
            <div>
              <p className="font-semibold">{u.name}</p>
              <p className="text-sm text-gray-400">{u.email}</p>

              <span
                className={`inline-block mt-1 text-xs px-2 py-1 rounded ${
                  u.role === "admin" ? "bg-red-600" : "bg-blue-600"
                }`}
              >
                {u.role.toUpperCase()}
              </span>
            </div>

            <button
              onClick={() => deleteUser(u._id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Delete
            </button>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <p className="text-gray-400">No users found.</p>
        )}

      </div>
    </div>
  );
}
