import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { formatCurrency } from "../../utils/money";

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rupeePerPoint, setRupeePerPoint] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        setLoading(true);
        const [meRes, historyRes] = await Promise.all([
          api.get("/loyalty/me"),
          api.get("/loyalty/me/history?limit=50"),
        ]);
        setLoyaltyPoints(meRes.data.data.balance || 0);
        setRupeePerPoint(meRes.data.data.settings?.rupeePerPoint || 1);
        setLoyaltyHistory(historyRes.data.data.data || []);
      } catch (err) {
        console.error("Failed to fetch loyalty history", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      setUpdating(true);
      setSuccessMsg("");
      setErrorMsg("");
      // Mock update profile message for now
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMsg("Profile settings updated successfully!");
    } catch (err) {
      setErrorMsg("Failed to update profile settings.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080411] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/dashboard" className="text-sm font-semibold text-orange-200 hover:text-orange-100">
          ← Back to Dashboard
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[22rem_1fr]">
          {/* Left Column: Profile Card */}
          <section className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-300">Profile</p>
            <h1 className="mt-2 text-3xl font-black">My Settings</h1>
            
            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-slate-400 outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-200 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none ring-orange-400/40 focus:ring-4 placeholder:text-slate-500"
                />
              </div>

              {successMsg && (
                <p className="text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  {successMsg}
                </p>
              )}

              {errorMsg && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {errorMsg}
                </p>
              )}

              <button
                onClick={saveProfile}
                disabled={updating}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 py-4 font-black transition hover:from-red-400 hover:to-orange-400 disabled:opacity-60"
              >
                {updating ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </section>

          {/* Right Column: Loyalty Panel */}
          <section className="flex flex-col gap-6">
            {/* Loyalty points card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-[#1c0e2a] to-[#0d071b] p-6 shadow-2xl md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

              <div className="z-10 flex items-center gap-5">
                <span className="text-5xl animate-bounce">🪙</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-300">Your Pizza Coins</h2>
                  <p className="text-4xl font-black mt-1 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    {loyaltyPoints} Points
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Equivalent to <b className="text-white">{formatCurrency(loyaltyPoints * rupeePerPoint)}</b> off your next order.
                  </p>
                </div>
              </div>
              <div className="z-10 shrink-0">
                <Link
                  to="/"
                  className="inline-block rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3.5 text-sm font-black shadow-lg hover:from-red-400 hover:to-orange-400"
                >
                  Order Pizza & Earn More
                </Link>
              </div>
            </div>

            {/* Transaction log panel */}
            <div className="flex-1 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md md:p-8">
              <h2 className="text-xl font-black">Points Transaction History</h2>
              <p className="text-sm text-slate-400 mt-1">Track your earnings, redemptions, and refunds.</p>

              {loading ? (
                <div className="py-12 text-center text-slate-400">Loading points history...</div>
              ) : loyaltyHistory.length === 0 ? (
                <div className="py-20 text-center">
                  <span className="text-5xl block mb-4">🍕</span>
                  <h3 className="font-bold text-slate-300">No transactions yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Place orders to start earning loyalty points!</p>
                </div>
              ) : (
                <div className="mt-8 space-y-4 max-h-[30rem] overflow-y-auto pr-2 animate-fade-in">
                  {loyaltyHistory
                    .map((item, idx) => {
                      const isPositive = item.type === "earn" || item.type === "refund";
                      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={item._id || idx}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-10 w-10 place-items-center rounded-xl font-black text-lg ${
                                isPositive
                                  ? "bg-green-500/10 text-green-400"
                                  : item.type === "redeem"
                                  ? "bg-orange-500/10 text-orange-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {item.type === "earn" ? "📈" : item.type === "refund" ? "🔄" : item.type === "redeem" ? "📉" : "⚠️"}
                            </span>
                            <div>
                              <p className="font-bold text-slate-200">{item.description}</p>
                              <p className="text-xs text-slate-500 mt-1">{dateStr}</p>
                            </div>
                          </div>
                          <span
                            className={`font-black text-lg ${
                              isPositive ? "text-green-400" : "text-orange-400"
                            }`}
                          >
                            {isPositive ? `+${item.points}` : `-${item.points}`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
