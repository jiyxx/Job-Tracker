import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  fetchStats,
  fetchApplications,
  generateApplicationSummary,
} from "../store/applicationsSlice";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import ApplicationFormModal from "../components/ApplicationFormModal";
import SummaryRenderer from "../components/SummaryRenderer";
import { createPortal } from "react-dom";
import {
  Briefcase,
  Calendar,
  MapPin,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Pencil,
  X,
  Clock,
} from "lucide-react";

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

const SummaryCard = ({ label, value, subtext, valueClass, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-2xl border border-gray-100 bg-white p-5 text-left transition-all hover:border-gray-200 hover:shadow-md cursor-pointer group flex flex-col justify-between"
  >
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
    {subtext && (
      <p className="mt-2 text-xs font-medium text-gray-500">{subtext}</p>
    )}
  </button>
);

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    stats,
    statsStatus,
    statsError,
    items,
    status,
    summaryLoadingId,
    summaryError,
  } = useSelector((state) => state.applications);
  const user = useSelector((state) => state.auth.user);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);

  useEffect(() => {
    if (!user) return;

    if (status === "idle") {
      dispatch(fetchApplications());
    }

    if (statsStatus === "idle") {
      dispatch(fetchStats());
    }
  }, [dispatch, user, status, statsStatus]);
  // Keep selectedApplication synced with Redux store updates
  useEffect(() => {
    if (selectedApplication) {
      const updated = items.find((a) => a._id === selectedApplication._id);
      if (updated) setSelectedApplication(updated);
    }
  }, [items]);

  const handleAiSummary = (id, e) => {
    if (e) e.stopPropagation();
    dispatch(generateApplicationSummary(id));
  };

  if (statsStatus === "loading" && !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-12 text-center text-sm text-gray-400">
          Loading dashboard overview…
        </div>
      </div>
    );
  }

  if (statsStatus === "failed" && !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {statsError || "Something went wrong loading your dashboard."}
        </div>
      </div>
    );
  }

  const total = stats?.total || 0;
  const active = stats?.active || 0;
  const offers = stats?.offers || 0;
  const rejected = stats?.rejected || 0;

  const countFor = (group) =>
    (stats?.byStatus || [])
      .filter((s) => group.statuses.includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

  const interviewCount = countFor(STATUS_GROUPS[1]);
  const interviewRate =
    total > 0 ? Math.round((interviewCount / total) * 100) : 0;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const pieData = STATUS_GROUPS.map((group) => ({
    name: group.label,
    value: countFor(group),
    color: group.color,
  })).filter((d) => d.value > 0);

  // Upcoming interviews
  const upcomingInterviews = items.filter(
    (app) => app.status === "Interview Scheduled" || app.interviewDateTime,
  );

  // Recent applications (last 5)
  const recentApplications = items.slice(0, 5);

  // AI Summaries count
  const aiSummariesCount = items.filter((app) => Boolean(app.aiSummary)).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* <button
            onClick={() => {
              setEditingApplication(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Add application</span>
          </button> */}

          <button
            onClick={() => navigate("/notes")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Briefcase size={15} />
            <span>Prep Notes</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Applications"
          value={total}
          valueClass="text-gray-900"
          subtext="All tracked jobs"
          onClick={() => navigate("/applications", { state: { status: "" } })}
        />

        <SummaryCard
          label="Active Tracking"
          value={active}
          valueClass="text-blue-600"
          subtext={`${interviewRate}% interview rate`}
          onClick={() =>
            navigate("/applications", { state: { status: "Applied" } })
          }
        />

        <SummaryCard
          label="Offers Received"
          value={offers}
          valueClass="text-green-600"
          subtext={`${offerRate}% offer rate`}
          onClick={() =>
            navigate("/applications", { state: { status: "Offer Received" } })
          }
        />

        <SummaryCard
          label="Rejected"
          value={rejected}
          valueClass="text-red-600"
          subtext="Closed applications"
          onClick={() =>
            navigate("/applications", { state: { status: "Rejected" } })
          }
        />
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Upcoming Interviews & Applications Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Interviews Widget */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-amber-500" />
                <span>Upcoming Interviews</span>
              </h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {upcomingInterviews.length} Scheduled
              </span>
            </div>

            {upcomingInterviews.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  No interviews scheduled yet
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Scheduled interviews will appear here automatically when
                  updated.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {upcomingInterviews.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApplication(app)}
                    className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-4 hover:border-amber-200 transition-all cursor-pointer group"
                  >
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-amber-900 transition-colors">
                        {app.companyName}
                      </h3>
                      <p className="text-xs text-gray-600">{app.role}</p>

                      {app.interviewDateTime && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                          <Clock size={13} className="text-amber-600" />
                          <span>{formatDateTime(app.interviewDateTime)}</span>
                        </div>
                      )}
                    </div>

                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications by Status Chart */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">
              Applications Status Breakdown
            </h2>

            {total === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No applications added yet. Add one to see your breakdown.
              </p>
            ) : (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {STATUS_GROUPS.map((group) => {
                    const cnt = countFor(group);
                    const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                    return (
                      <div
                        key={group.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span className="font-semibold text-gray-800">
                            {group.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 font-medium">
                            {cnt} jobs
                          </span>
                          <span className="w-12 text-right font-bold text-gray-900">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Recent Activity & AI Readiness */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Prep Banner */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-purple-950">AI Interview Prep</h3>
                <p className="text-xs text-purple-700">
                  {aiSummariesCount} of {total} applications have AI Summaries
                  ready.
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-purple-800 leading-relaxed">
              Generate AI Summaries to get structured interview questions, key
              topics, and revision checklists tailored to each job!
            </p>
          </div>

          {/* Recent Applications Feed */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                Recent Applications
              </h2>
              <button
                onClick={() => navigate("/applications")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  No applications yet
                </p>
                <button
                  onClick={() => {
                    setEditingApplication(null);
                    setShowFormModal(true);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 cursor-pointer"
                >
                  <Plus size={14} />
                  Add your first job
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {recentApplications.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => setSelectedApplication(app)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/60 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                        {app.companyName}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {app.role}
                      </p>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Applied {formatDate(app.dateApplied)}
                      </span>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <StatusBadge status={app.status} />
                      {app.aiSummary && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700">
                          <Sparkles
                            size={10}
                            className="text-purple-600 fill-purple-200"
                          />
                          AI Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* READ-ONLY APPLICATION DETAIL MODAL */}
      {selectedApplication &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 cursor-pointer"
            onClick={() => setSelectedApplication(null)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* STICKY HEADER */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 bg-white shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApplication.companyName}
                  </h2>
                  <p className="text-base text-gray-500 mt-0.5">
                    {selectedApplication.role}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StatusBadge status={selectedApplication.status} />

                    {selectedApplication.location && (
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-500">
                        <MapPin size={13} />
                        {selectedApplication.location}
                      </span>
                    )}

                    {selectedApplication.dateApplied && (
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                        <Calendar size={13} />
                        Applied {formatDate(selectedApplication.dateApplied)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
                >
                  <X size={22} />
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {selectedApplication.jobLink && (
                  <div>
                    <a
                      href={selectedApplication.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      <span>View Job Link</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {selectedApplication.interviewDateTime && (
                  <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 text-sm text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-600" />
                      Interview Scheduled
                    </p>
                    <p className="mt-1 text-amber-800">
                      {formatDateTime(selectedApplication.interviewDateTime)}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Job Description
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 border border-gray-100 max-h-48 overflow-y-auto">
                    {selectedApplication.jobDescription || (
                      <span className="text-gray-400 text-xs italic">
                        No job description provided.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Personal Notes
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 border border-gray-100">
                    {selectedApplication.notes || (
                      <span className="text-gray-400 italic">
                        No personal notes added.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-600" />
                      AI Summary
                    </h3>

                    <button
                      onClick={(e) =>
                        handleAiSummary(selectedApplication._id, e)
                      }
                      disabled={summaryLoadingId === selectedApplication._id}
                      className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Sparkles size={12} />
                      {summaryLoadingId === selectedApplication._id
                        ? "Generating..."
                        : selectedApplication.aiSummary
                          ? "Regenerate AI Summary"
                          : "Generate AI Summary"}
                    </button>
                  </div>

                  {selectedApplication.aiSummary ? (
                    <SummaryRenderer text={selectedApplication.aiSummary} />
                  ) : (
                    <>
                      {summaryError && summaryLoadingId === null && (
                        <div className="mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                          {summaryError}
                        </div>
                      )}
                      <p className="text-xs italic text-gray-400">
                        No AI summary generated yet. Click "Generate AI Summary"
                        to create one using Gemini.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* STICKY FOOTER */}
              <div className="flex items-center justify-end p-4 px-6 border-t border-gray-100 bg-white shrink-0">
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    setEditingApplication(selectedApplication);
                    setShowFormModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={15} />
                  <span>Edit application</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ADD/EDIT FORM MODAL */}
      <ApplicationFormModal
        open={showFormModal}
        application={editingApplication}
        onClose={() => {
          setShowFormModal(false);
          setEditingApplication(null);
        }}
      />
    </div>
  );
};

export default Dashboard;
