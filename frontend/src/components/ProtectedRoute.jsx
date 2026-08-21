import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute:", {
    user,
    loading,
  });

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading NexusAI...</p>
      </div>
    );
  }

  if (!user) {
    console.log("No authenticated user. Redirecting to login.");

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
