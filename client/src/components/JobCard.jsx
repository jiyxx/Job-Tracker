import { useDispatch } from "react-redux";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { deleteApplication } from "../store/applicationsSlice";
import StatusBadge from "./StatusBadge";

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


const JobCard = ({ application, onClick, onEdit, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(application);
  };

  return (
    <div
      onClick={() => onClick && onClick(application)}
      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          {application.companyName}
        </h3>
        <p className="mt-0.5 text-gray-500">{application.role}</p>

        <div className="mt-3 flex items-center flex-wrap gap-3">
          <StatusBadge status={application.status} />
          <span className="text-sm text-gray-400">
            Applied {formatDate(application.dateApplied)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3">
        {/* Edit & Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(application);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(application);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* AI Summary Badge */}
        {application.aiSummary ? (
          <span className="inline-flex items-center justify-center rounded-lg px-3 py-1  bg-purple-100 border border-purple-200 text-xs font-semibold text-purple-700 min-w-[120px]">
            <Sparkles size={12} className="mr-1" />
            AI Summary
          </span>
        ) : (
          <span className="inline-flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 min-w-[120px]">
            <Sparkles size={12} className="mr-1" />
            No AI Summary
          </span>
        )}
      </div>
    </div>
  );
};

export default JobCard;
