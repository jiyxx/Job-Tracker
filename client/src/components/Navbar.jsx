// export default Navbar;
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Briefcase } from "lucide-react";
import { logout } from "../store/authSlice";
import { resetApplicationsState } from "../store/applicationsSlice";
import { resetNotesState } from "../store/notesSlice";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import ProfileModal from "../components/ProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
  }`;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [showMenu, setShowMenu] = useState(false);
  useEffect(() => {
    setShowMenu(false);
  }, [user]);

  const menuRef = useRef(null);

  const [showProfile, setShowProfile] = useState(false);

  // Generate initials
  const getInitials = (name) => {
    if (!name) return "";

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    setShowMenu(false);

    dispatch(resetApplicationsState());
    dispatch(resetNotesState());
    dispatch(logout());

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/applications"
          className="flex items-center gap-2 text-xl font-bold text-gray-900"
        >
          <Briefcase size={22} strokeWidth={2.5} />
          Job<span className="text-teal-600">Tracker</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-2 sm:flex">
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/applications" className={navLinkClass}>
              Applications
            </NavLink>
            <NavLink to="/notes" className={navLinkClass}>
              Notes
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {getInitials(user.name)}
                </div>

                <ChevronDown
                  size={18}
                  className={`transition-transform ${
                    showMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowProfile(true);
                    }}
                    className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                  >
                    👤 My Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-red-600 hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/register"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
            >
              Sign Up
            </Link>
          )}
        </div>
        <ProfileModal
        open={showProfile}
        user={user}
        onClose={() => setShowProfile(false)}
        onChangePassword={() => {
          setShowProfile(false);
          setShowPasswordModal(true);
        }}
      />
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      </div>
    </header>
  );
};
export default Navbar;
