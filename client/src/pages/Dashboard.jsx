import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { fetchStats } from "../store/applicationsSlice";
import { useNavigate } from "react-router-dom";

const STATUS_GROUPS = [
  { label: "Applied", color: "#3B82F6", statuses: ["Applied"] },
  {
    label: "Interview",
    color: "#F59E0B",
    statuses: ["Shortlisted", "Interview Scheduled"],
  },
  { label: "Rejected", color: "#EF4444", statuses: ["Rejected"] },
  { label: "Offer", color: "#22C55E", statuses: ["Offer Received"] },
];

const SummaryCard = ({ label, value, valueClass, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-2xl bg-gray-50 p-5 text-left transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer"
  >
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
  </button>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, statsStatus, statsError } = useSelector(
    (state) => state.applications,
  );

  // Fetch stats only ONCE when status is idle
  useEffect(() => {
    if (statsStatus === "idle") {
      dispatch(fetchStats());
    }
  }, [dispatch, statsStatus]);

  if (statsStatus === "loading" && !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-12 text-center text-sm text-gray-400">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  if (statsStatus === "failed" && !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {statsError || "Something went wrong loading your dashboard."}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const countFor = (group) =>
    stats.byStatus
      .filter((s) => group.statuses.includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

  const total = stats.total || 0;
  const pieData = STATUS_GROUPS.map((group) => ({
    name: group.label,
    value: countFor(group),
    color: group.color,
  })).filter((d) => d.value > 0);

  const hasData = total > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Total"
          value={stats.total}
          valueClass="text-gray-900"
          onClick={() => navigate("/applications", { state: { status: "" } })}
        />

        <SummaryCard
          label="Active"
          value={stats.active}
          valueClass="text-blue-600"
          onClick={() =>
            navigate("/applications", {
              state: { status: "Applied" },
            })
          }
        />

        <SummaryCard
          label="Offers"
          value={stats.offers}
          valueClass="text-green-600"
          onClick={() =>
            navigate("/applications", {
              state: { status: "Offer Received" },
            })
          }
        />

        <SummaryCard
          label="Rejected"
          value={stats.rejected}
          valueClass="text-red-600"
          onClick={() =>
            navigate("/applications", {
              state: { status: "Rejected" },
            })
          }
        />
      </div>

      <h2 className="mt-10 text-lg font-bold text-gray-900">
        Applications by status
      </h2>

      {!hasData ? (
        <p className="mt-4 text-sm text-gray-500">
          No applications yet — add one to see your status breakdown here.
        </p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-8 sm:flex-row">
          <div className="h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={0}
                  outerRadius="100%"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-col gap-2">
            {pieData.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center gap-2 text-gray-800"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>
                  {entry.name} — {Math.round((entry.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
