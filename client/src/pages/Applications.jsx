import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchApplications, setFilters } from "../store/applicationsSlice";
import JobCard from "../components/JobCard";
import StatusBadge from "../components/StatusBadge";
import { Pencil, X, ExternalLink, Calendar, MapPin } from "lucide-react";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Applied", value: "Applied" },
  { label: "Interview", value: "Interview Scheduled" },
  { label: "Offer", value: "Offer Received" },
  { label: "Rejected", value: "Rejected" },
];

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Applications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status, error, filters } = useSelector((state) => state.applications);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchApplications());
    }
  }, [dispatch, status]);

  // Keep selectedApplication synced with Redux store updates
  useEffect(() => {
    if (selectedApplication) {
      const updated = items.find((a) => a._id === selectedApplication._id);
      if (updated) setSelectedApplication(updated);
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((app) => {
      const matchesStatus = !filters.status || app.status === filters.status;
      const searchQuery = (filters.search || "").toLowerCase().trim();
      const matchesSearch =
        !searchQuery ||
        app.companyName?.toLowerCase().includes(searchQuery) ||
        app.role?.toLowerCase().includes(searchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [items, filters.status, filters.search]);

  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleFilterClick = (value) => {
    dispatch(setFilters({ status: value }));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All applications</h1>
        <Link
          to="/applications/new"
          className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
        >
          + Add new
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search company or role…"
          className="min-w-[220px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => handleFilterClick(f.value)}
            className={`rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors ${
              filters.status === f.value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="mt-12 text-center text-sm text-gray-400">Loading your applications…</div>
      )}

      {status === "failed" && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Something went wrong loading your applications."}
        </div>
      )}

      {status === "succeeded" && filteredItems.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-lg font-bold text-gray-900">
            {items.length === 0 ? "No applications yet" : "No matching applications found"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {items.length === 0
              ? "Add the first job you've applied to and start tracking it from here."
              : "Try adjusting your search query or status filter."}
          </p>
          {items.length === 0 && (
            <Link
              to="/applications/new"
              className="mt-5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              Add your first application
            </Link>
          )}
        </div>
      )}

      {status === "succeeded" && filteredItems.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {filteredItems.map((application) => (
            <JobCard
              key={application._id}
              application={application}
              onClick={(app) => setSelectedApplication(app)}
            />
          ))}
        </div>
      )}

      {/* READ-ONLY APPLICATION DETAIL MODAL */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-gray-100 relative">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedApplication.companyName}
                </h2>
                <p className="text-base text-gray-500 mt-0.5">{selectedApplication.role}</p>

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
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={22} />
              </button>
            </div>

            {/* Job Link */}
            {selectedApplication.jobLink && (
              <div className="mt-4">
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

            {/* Interview Date & Time */}
            {selectedApplication.interviewDateTime && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 border border-amber-100 text-sm text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-600" />
                  Interview Scheduled
                </p>
                <p className="mt-1 text-amber-800">
                  {new Date(selectedApplication.interviewDateTime).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            )}

            {/* Job Description */}
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Job Description
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 border border-gray-100 max-h-48 overflow-y-auto">
                {selectedApplication.jobDescription || (
                  <span className="text-gray-400 italic">No job description provided.</span>
                )}
              </div>
            </div>

            {/* Personal Notes */}
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Personal Notes
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 border border-gray-100">
                {selectedApplication.notes || (
                  <span className="text-gray-400 italic">No personal notes added.</span>
                )}
              </div>
            </div>

            {/* Modal Footer with Edit Button */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => navigate(`/applications/${selectedApplication._id}/edit`)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <Pencil size={15} />
                <span>Edit application</span>
              </button>
              <button
                onClick={() => setSelectedApplication(null)}
                className="rounded-xl border border-gray-200 bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;