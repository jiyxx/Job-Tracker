import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "../store/authSlice";

// NOTE: This context does NOT hold app state itself — Redux (authSlice) is
// the single source of truth for auth data, per project conventions.
// This context's only job is to trigger session rehydration once on mount
// and expose a simple `ready` flag so routes know when that check is done.

const AuthContext = createContext({ ready: false });

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const status = useSelector((state) => state.auth.status);

  useEffect(() => {

    if (token && status === "idle") {
      dispatch(loadUser());
    }
  }, [token, status, dispatch]);

  const ready = !token || status === "succeeded" || status === "failed";

  return <AuthContext.Provider value={{ ready }}>{children}</AuthContext.Provider>;

};

export const useAuthReady = () => useContext(AuthContext);
