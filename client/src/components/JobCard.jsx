import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Pencil, Trash2 } from "lucide-react";
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

const JobCard = ({ application, onClick }) => {
  const dispatch = useDispatch();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Delete application for ${application.role} at ${application.companyName}?`
      )
    ) {
      dispatch(deleteApplication(application._id));
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onClick && onClick(application)}
      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm cursor-pointer hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div>
        <h3 className="text-xl font-bold text-gray-900">{application.companyName}</h3>
        <p className="mt-0.5 text-gray-500">{application.role}</p>

        <div className="mt-3 flex items-center gap-3">
          <StatusBadge status={application.status} />
          <span className="text-sm text-gray-400">
            Applied {formatDate(application.dateApplied)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/applications/${application._id}/edit`}
          onClick={handleEditClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label={`Edit application for ${application.companyName}`}
        >
          <Pencil size={16} />
        </Link>
        <button
          onClick={handleDelete}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label={`Delete application for ${application.companyName}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default JobCard;