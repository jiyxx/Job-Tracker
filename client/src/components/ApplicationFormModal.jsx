import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createApplication,
  updateApplication,
  fetchApplications,
} from "../store/applicationsSlice";

const emptyForm = {
  companyName: "",
  role: "",
  location: "",
  dateApplied: "",
  status: "Applied",
  jobLink: "",
  jobDescription: "",
  notes: "",
};

const REQUIRED_FIELDS = ["companyName", "role", "location", "dateApplied"];

const STATUS_OPTIONS = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Received",
  "Rejected",
];

const ApplicationFormModal = ({ open, onClose, application }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!application;

  useEffect(() => {
    if (application) {
      setForm({
        companyName: application.companyName || "",
        role: application.role || "",
        location: application.location || "",
        dateApplied: application.dateApplied
          ? application.dateApplied.slice(0, 10)
          : "",
        status: application.status || "Applied",
        jobLink: application.jobLink || "",
        jobDescription: application.jobDescription || "",
        notes: application.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [application]);
  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!form[field] || !form[field].trim()) {
        errors[field] = `${field} is required`;
      }
    });
    return errors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError("");

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    const payload = { ...form };

    const action = isEditMode
      ? updateApplication({
          id: application._id,
          updates: payload,
        })
      : createApplication(payload);

    const result = await dispatch(action);

    setSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      await dispatch(fetchApplications());
      onClose();
    } else {
      setSubmitError(
        result.payload || "Something went wrong. Please try again.",
      );
    }
  };
  const inputClass = (field) =>
    `w-full rounded-md border px-3 py-2 text-sm text-ink-900 placeholder:text-xs placeholder:text-gray-400 focus:outline-none ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-ink-200 focus:border-teal-600"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditMode ? "Edit Application" : "Add Application"}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            noValidate
            className=" rounded-card  bg-white p-6 shadow-card"
          >
            {submitError && (
              <div className="mb-4 rounded-md bg-clay-50 px-3 py-2 text-sm text-clay-700">
                {submitError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="companyName"
                >
                  Company name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={form.companyName}
                  onChange={handleChange}
                  className={inputClass("companyName")}
                  placeholder="e.g. Google"
                />
                {fieldErrors.companyName && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="role"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  className={inputClass("role")}
                  placeholder="e.g. SDE Intern"
                />
                {fieldErrors.role && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.role}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="location"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={form.location}
                  onChange={handleChange}
                  className={inputClass("location")}
                  placeholder="e.g. Bangalore"
                />
                {fieldErrors.location && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.location}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="dateApplied"
                >
                  Date applied <span className="text-red-500">*</span>
                </label>
                <input
                  id="dateApplied"
                  name="dateApplied"
                  type="date"
                  value={form.dateApplied}
                  onChange={handleChange}
                  className={inputClass("dateApplied")}
                />
                {fieldErrors.dateApplied && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.dateApplied}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="status"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-teal-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="jobLink"
                >
                  Job link
                </label>
                <input
                  id="jobLink"
                  name="jobLink"
                  type="url"
                  value={form.jobLink}
                  onChange={handleChange}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-xs placeholder:text-gray-400 focus:border-teal-600 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="jobDescription"
                >
                  Job description
                </label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  rows={4}
                  value={form.jobDescription}
                  onChange={handleChange}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-xs placeholder:text-gray-400 focus:border-teal-600 focus:outline-none"
                  placeholder="Paste the job description here…"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  className="mb-1 block text-sm font-medium text-ink-800"
                  htmlFor="notes"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-xs placeholder:text-gray-400 focus:border-teal-600 focus:outline-none"
                  placeholder="Any personal notes about this application…"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {submitting
                  ? "Saving…"
                  : isEditMode
                    ? "Save changes"
                    : "Add application"}
              </button>
              <button
                type="button"
                onClick={() => onClose()}
                className="rounded-md border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationFormModal;
