import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuthReady } from "../context/AuthContext";

// Wraps protected routes. Waits for the initial session check to finish
// (so a page refresh doesn't flash-redirect to /login before loadUser resolves),
// then redirects to /login if there's no authenticated user.
const PrivateRoute = () => {
  const { token, user } = useSelector((state) => state.auth);
  const { ready } = useAuthReady();

  if (token && !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <p className="font-sans text-sm text-ink-400">Checking your session…</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
