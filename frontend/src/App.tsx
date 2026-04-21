import { useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { buildTheme } from "@/theme";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MediaLibrary from "./pages/MediaLibrary";
import MediaDetail from "./pages/MediaDetail";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const App = () => {
  const [mode, setMode] = useState<"dark" | "light">(
    () => (localStorage.getItem("theme_mode") as "dark" | "light") || "dark"
  );
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const toggleMode = () => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem("theme_mode", next);
      return next;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout mode={mode} onToggleMode={toggleMode}>
                    <MediaLibrary />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/media/:id"
              element={
                <ProtectedRoute>
                  <AppLayout mode={mode} onToggleMode={toggleMode}>
                    <MediaDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute adminOnly>
                  <AppLayout mode={mode} onToggleMode={toggleMode}>
                    <Upload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
