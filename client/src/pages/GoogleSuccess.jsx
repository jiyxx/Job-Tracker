import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { googleLoginSuccess } from "../store/authSlice";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");
    const userParam = params.get("user");

    if (!token || !userParam) {
      navigate("/login", { replace: true });
      return;
    }

    const user = JSON.parse(decodeURIComponent(userParam));

    localStorage.setItem("token", token);

    dispatch(
      googleLoginSuccess({
        token,
        user,
      }),
    );

    navigate("/dashboard", { replace: true });
  }, [dispatch, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Signing you in...
    </div>
  );
};

export default GoogleSuccess;
