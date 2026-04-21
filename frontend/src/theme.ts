import { createTheme } from "@mui/material/styles";

export const buildTheme = (mode: "dark" | "light") =>
  createTheme({
    palette: {
      mode,
      primary: { main: "#7c5cff" },
      secondary: { main: "#22d3ee" },
      background:
        mode === "dark"
          ? { default: "#0b0d12", paper: "#12151c" }
          : { default: "#f7f7fb", paper: "#ffffff" },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            transition: "transform .2s ease, box-shadow .2s ease",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: "0 10px 30px -12px rgba(124,92,255,.45)",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: "none", fontWeight: 600 },
        },
      },
    },
  });