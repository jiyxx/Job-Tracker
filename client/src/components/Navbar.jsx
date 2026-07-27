import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Briefcase } from "lucide-react";
import { logout } from "../store/authSlice";

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
  }`;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/applications" className="flex items-center gap-2 text-xl font-bold text-gray-900">
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
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">Hi, {user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/register"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
            >
              Sign Up</Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;