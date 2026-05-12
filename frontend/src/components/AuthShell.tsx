import { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { tokens } from "@/theme";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Cinematic centered auth shell.
 *  - Dark gradient backdrop with a faint accent glow in one corner
 *  - Single centered card holds the form
 *  - No editorial side panel, no italics
 */
export const AuthShell = ({ title, subtitle, children, footer }: Props) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,106,43,.08), transparent 60%),
          radial-gradient(ellipse 60% 80% at 0% 100%, rgba(45,212,191,.05), transparent 60%),
          ${tokens.bg}
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, md: 4 },
      }}
    >
      {/* logo block */}
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            background: "linear-gradient(135deg, #ff6a2b 0%, #ff844f 100%)",
            display: "grid",
            placeItems: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.05em",
            boxShadow: "0 0 32px rgba(255,106,43,.22)",
          }}
        >
          F
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.02em",
          }}
        >
          FamFlix
        </Typography>
      </Stack>

      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          background: tokens.surface,
          border: `1px solid ${tokens.rule}`,
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          boxShadow:
            "0 20px 50px -12px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.02)",
        }}
      >
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14, mb: 3.5 }}
        >
          {subtitle}
        </Typography>
        {children}
      </Box>

      {footer && (
        <Box
          sx={{
            mt: 3,
            fontSize: 13,
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};
