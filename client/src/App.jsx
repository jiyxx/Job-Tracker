import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Applications from "./pages/Applications";
import AddApplication from "./pages/AddApplication";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import GoogleSuccess from "./pages/GoogleSuccess";

function App() {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/google-success" element={<GoogleSuccess />} />

        <Route element={<PrivateRoute />}>
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/new" element={<AddApplication />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
        </Route>

        <Route path="/" element={<Navigate to="/applications" replace />} />
        <Route path="*" element={<Navigate to="/applications" replace />} />
      </Routes>
    </div>
  );
}

export default App;
