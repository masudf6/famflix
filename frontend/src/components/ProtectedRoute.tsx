import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly }: Props) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};