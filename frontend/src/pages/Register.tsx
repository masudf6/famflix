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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register(fullName, email, password);
      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully. Please sign in." },
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
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
            <Typography variant="h5">Create your account</Typography>
            <Typography variant="body2" color="text.secondary">
              Join the family library
            </Typography>
          </Stack>

          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="At least 8 characters"
              />

              <TextField
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <Typography variant="body2" color="text.secondary" align="center">
                Already have an account?{" "}
                <MuiLink component={RouterLink} to="/login">
                  Sign in
                </MuiLink>
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;