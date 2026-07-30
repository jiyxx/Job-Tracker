
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";



export default function PasswordInput({
  name,
  label,
  value,
  onChange,
  visible,
  toggle,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full rounded-xl border px-4 py-3 pr-10"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-3"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}