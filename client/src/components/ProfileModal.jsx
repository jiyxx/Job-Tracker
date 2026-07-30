import { X, User, Mail, Lock } from "lucide-react";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
};

const ProfileModal = ({
  open,
  user,
  onClose,
  onChangePassword,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">
            My Profile
          </h2>

          <button onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* Body */}

        <div className="p-6">

          <div className="mb-6 flex justify-center">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-600 text-3xl font-bold text-white">
              {getInitials(user?.name)}
            </div>

          </div>

          <div className="space-y-5">

            <div>

              <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-500">
                <User size={16} />
                Full Name
              </label>

              <p className="rounded-lg border bg-gray-50 px-4 py-3">
                {user?.name}
              </p>

            </div>

            <div>

              <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-500">
                <Mail size={16} />
                Email
              </label>

              <p className="rounded-lg border bg-gray-50 px-4 py-3">
                {user?.email}
              </p>

            </div>

          </div>

          <button
            onClick={onChangePassword}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <Lock size={18} />
            Change Password
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;