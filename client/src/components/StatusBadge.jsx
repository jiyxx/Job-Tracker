const STATUS_STYLES = {
  Applied: "bg-blue-100 text-blue-700",
  Shortlisted: "bg-amber-100 text-amber-700",
  "Interview Scheduled": "bg-amber-100 text-amber-700",
  "Offer Received": "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const STATUS_SHORT_LABEL = {
  Applied: "Applied",
  Shortlisted: "Shortlisted",
  "Interview Scheduled": "Interview",
  "Offer Received": "Offer",
  Rejected: "Rejected",
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  const label = STATUS_SHORT_LABEL[status] || status;

  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${style}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;