import { useState } from "react";
import { X, Eye, EyeOff, Lock } from "lucide-react";
import api from "../api/axios";
import PasswordInput from "./PasswordInput";

const ChangePasswordModal = ({ open, onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess("Password updated successfully!");

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Lock size={20} />
            Change Password
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
              {error}
            </div>
          )}

          <PasswordInput
            name="currentPassword"
            label="Current Password"
            value={form.currentPassword}
            onChange={handleChange}
            visible={show.current}
            toggle={() =>
              setShow((prev) => ({
                ...prev,
                current: !prev.current,
              }))
            }
          />

          <PasswordInput
            name="newPassword"
            label="New Password"
            value={form.newPassword}
            onChange={handleChange}
            visible={show.new}
            toggle={() =>
              setShow((prev) => ({
                ...prev,
                new: !prev.new,
              }))
            }
          />

          <PasswordInput
            name="confirmPassword"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            visible={show.confirm}
            toggle={() =>
              setShow({
                ...show,
                confirm: !show.confirm,
              })
            }
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white hover:bg-teal-700"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
