import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 20% 20%, rgba(124,92,255,.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(34,211,238,.2), transparent 40%)",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
            <MovieFilterIcon sx={{ fontSize: 48, color: "primary.main" }} />
            <Typography variant="h5">Welcome back</Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your family library
            </Typography>
          </Stack>
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} /> : null}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <Typography variant="body2" color="text.secondary" align="center">
                Don't have an account?{" "}
                <MuiLink component={RouterLink} to="/register">
                  Sign up
                </MuiLink>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;