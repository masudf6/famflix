import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { tokens } from "@/theme";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,106,43,.08), transparent 60%),
          ${tokens.bg}
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 480, textAlign: "center" }}>
        <Typography
          sx={{
            fontSize: { xs: "5rem", md: "7rem" },
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            background:
              `linear-gradient(180deg, ${tokens.text} 0%, ${tokens.textDim} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h3"
          sx={{ fontWeight: 600, letterSpacing: "-0.02em", mb: 1.5 }}
        >
          Page not found
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 15, mb: 4, maxWidth: "44ch", mx: "auto" }}
        >
          We couldn't find what you were looking for. It may have moved, or
          never existed.
        </Typography>
        <Box
          sx={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            fontSize: 12,
            color: "text.secondary",
            background: tokens.surface,
            border: `1px solid ${tokens.rule}`,
            borderRadius: 1.5,
            py: 0.75,
            px: 1.5,
            display: "inline-block",
            mb: 4,
          }}
        >
          {location.pathname}
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="center"
        >
          <Button
            variant="contained"
            color="secondary"
            component={RouterLink}
            to="/"
            endIcon={<ArrowForwardIcon />}
          >
            Back to library
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default NotFound;
