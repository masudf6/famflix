import { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { FONT_MONO, FONT_SERIF } from "@/theme";

interface Props {
  children: ReactNode;
  /** Form-side copy: small overline above the heading */
  eyebrow: string;
  /** Big serif heading on the form side */
  heading: string;
  /** One-line subhead under the heading */
  subhead: string;
}

/**
 * Two-column layout used by Login and Register.
 *  - Left: editorial card with wordmark, masthead lines, a quote, and a colophon.
 *  - Right: the form, with eyebrow/heading/subhead above whatever the page passes in.
 *
 * On mobile the editorial side becomes a slim header strip.
 */
export const AuthScaffold = ({ children, eyebrow, heading, subhead }: Props) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
      }}
    >
      {/* Editorial side */}
      <Box
        sx={{
          position: "relative",
          color: "primary.contrastText",
          bgcolor: "primary.main",
          overflow: "hidden",
          minHeight: { xs: 200, md: "100vh" },
          display: "flex",
          flexDirection: "column",
          p: { xs: 3, md: 6 },
        }}
      >
        {/* paper texture */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,.18) 0, transparent 40%)," +
              "radial-gradient(circle at 80% 70%, rgba(0,0,0,.25) 0, transparent 50%)",
          }}
        />
        {/* hairline frame */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: { xs: 12, md: 24 },
            border: "1px solid rgba(255,255,255,.22)",
            pointerEvents: "none",
          }}
        />

        <Stack
          direction="row"
          alignItems="baseline"
          spacing={1.25}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Typography
            sx={{
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: { xs: 24, md: 28 },
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            FamFlix
          </Typography>
          <Box
            sx={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            est. {new Date().getFullYear()}
          </Box>
        </Stack>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            mt: { xs: 3, md: "auto" },
            mb: { xs: 0, md: "auto" },
          }}
        >
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              fontFamily: FONT_MONO,
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.75,
              mb: 3,
            }}
          >
            ◆ A periodical, of sorts
          </Box>
          <Typography
            sx={{
              display: { xs: "none", md: "block" },
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: { md: "2.5rem", lg: "3.25rem" },
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              maxWidth: 480,
              mb: 4,
            }}
          >
            “What's worth keeping, kept where the family can find it.”
          </Typography>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: "0.06em",
              opacity: 0.8,
            }}
          >
            — the editor
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            mt: "auto",
            display: { xs: "none", md: "block" },
          }}
        >
          <Stack
            direction="row"
            spacing={3}
            sx={{
              fontFamily: FONT_MONO,
              fontSize: 10.5,
              letterSpacing: "0.06em",
              opacity: 0.78,
              textTransform: "uppercase",
            }}
            divider={
              <Box
                aria-hidden
                sx={{
                  borderLeft: "1px solid rgba(255,255,255,.3)",
                  height: 12,
                  alignSelf: "center",
                }}
              />
            }
          >
            <Box>private</Box>
            <Box>ad-free</Box>
            <Box>self-hosted</Box>
          </Stack>
        </Box>
      </Box>

      {/* Form side */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: { xs: 3, md: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420, mx: "auto" }}>
          <Box
            sx={{
              fontFamily: FONT_MONO,
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1.5,
            }}
          >
            {eyebrow}
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: { xs: "2rem", md: "2.5rem" },
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              mb: 1.5,
            }}
          >
            {heading}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 4, maxWidth: "44ch", lineHeight: 1.6 }}
          >
            {subhead}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
