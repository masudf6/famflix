import { ReactNode, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  mode: "dark" | "light";
  onToggleMode: () => void;
}

export const AppLayout = ({ children, mode, onToggleMode }: Props) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === "admin";

  const navItem = (to: string, label: string, icon: ReactNode) => {
    const active = location.pathname === to;
    return (
      <Button
        component={RouterLink}
        to={to}
        startIcon={icon}
        color={active ? "primary" : "inherit"}
        variant={active ? "contained" : "text"}
        size="small"
        sx={{ ml: 1 }}
      >
        {label}
      </Button>
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar>
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <MovieFilterIcon sx={{ color: "primary.main", mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Family Stream
            </Typography>
          </Box>

          <Box sx={{ flex: 1, display: "flex", ml: 2 }}>
            {navItem("/", "Library", <VideoLibraryIcon fontSize="small" />)}
            {isAdmin &&
              navItem("/upload", "Upload", <CloudUploadIcon fontSize="small" />)}
          </Box>

          <Tooltip title="Toggle theme">
            <IconButton onClick={onToggleMode} color="inherit">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {user && (
            <Tooltip title={`${user.email} (${user.role})`}>
              <Avatar sx={{ ml: 1, width: 32, height: 32, bgcolor: "primary.main" }}>
                {user.email[0].toUpperCase()}
              </Avatar>
            </Tooltip>
          )}
          <Tooltip title="Log out">
            <IconButton
              onClick={() => {
                logout();
                navigate("/login");
              }}
              color="inherit"
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};