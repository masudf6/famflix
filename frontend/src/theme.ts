import { createTheme, ThemeOptions } from "@mui/material/styles";

export const FONT_BODY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const BG = "#07090d";
const SURFACE = "#0d1117";
const SURFACE_RAISED = "#121823";
const SURFACE_INPUT = "#0f141d";
const RULE = "rgba(255,255,255,.08)";
const RULE_STRONG = "rgba(255,255,255,.14)";

const TEXT = "#edf1f7";
const TEXT_DIM = "#9aa4b2";
const TEXT_FAINT = "#66707e";

const ACCENT = "#ff6a2b";
const ACCENT_DEEP = "#ff844f";
const ACCENT_INK = "#ffffff";

const sharedTypography: ThemeOptions["typography"] = {
  fontFamily: FONT_BODY,
  fontSize: 14,
  htmlFontSize: 16,
  h1: {
    fontWeight: 700,
    fontSize: "clamp(2.6rem, 5vw, 4.4rem)",
    lineHeight: 0.96,
    letterSpacing: "-0.04em",
  },
  h2: {
    fontWeight: 700,
    fontSize: "clamp(1.9rem, 3.5vw, 2.65rem)",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
  },
  h3: {
    fontWeight: 700,
    fontSize: "1.55rem",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  h4: {
    fontWeight: 650,
    fontSize: "1.28rem",
    lineHeight: 1.22,
    letterSpacing: "-0.015em",
  },
  h5: {
    fontWeight: 650,
    fontSize: "1.05rem",
    lineHeight: 1.26,
  },
  h6: {
    fontWeight: 700,
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  body1: { lineHeight: 1.6, fontSize: "0.95rem" },
  body2: { lineHeight: 1.55, fontSize: "0.84rem" },
  caption: { fontSize: "0.75rem", letterSpacing: "0.01em", lineHeight: 1.4 },
  overline: {
    fontSize: "0.7rem",
    letterSpacing: "0.14em",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  button: {
    fontWeight: 600,
    letterSpacing: "0.005em",
    textTransform: "none",
  },
};

export const buildTheme = () => {
  const mode = "dark" as const;

  return createTheme({
    palette: {
      mode,
      primary: { main: ACCENT, dark: ACCENT_DEEP, contrastText: ACCENT_INK },
      secondary: { main: TEXT },
      text: { primary: TEXT, secondary: TEXT_DIM },
      background: { default: BG, paper: SURFACE },
      divider: RULE,
      error: { main: "#f87171" },
      warning: { main: "#fbbf24" },
      success: { main: "#4ade80" },
      info: { main: "#60a5fa" },
    },
    shape: { borderRadius: 10 },
    typography: sharedTypography,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: mode,
            "--ff-bg": BG,
            "--ff-surface": SURFACE,
            "--ff-surface-raised": SURFACE_RAISED,
            "--ff-surface-input": SURFACE_INPUT,
            "--ff-rule": RULE,
            "--ff-rule-strong": RULE_STRONG,
            "--ff-text": TEXT,
            "--ff-text-dim": TEXT_DIM,
            "--ff-text-faint": TEXT_FAINT,
            "--ff-accent": ACCENT,
            "--ff-accent-deep": ACCENT_DEEP,
            "--ff-accent-ink": ACCENT_INK,
            "--ff-hover-subtle": "rgba(255,255,255,.05)",
            "--ff-overlay-strong": "rgba(7,9,13,.88)",
            "--ff-overlay-soft": "rgba(7,9,13,.52)",
            "--ff-glass": "rgba(12,16,22,.66)",
            "--ff-glass-hover": "rgba(14,18,25,.82)",
            "--ff-inverse-surface": "rgba(255,255,255,.94)",
            "--ff-inverse-text": "#0b0d10",
          },
          "*": { boxSizing: "border-box" },
          html: { scrollBehavior: "smooth" },
          body: {
            background: BG,
            color: TEXT,
            fontFeatureSettings: '"cv11", "ss01", "cv02"',
          },
          "body::before": {
            content: '""',
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at top right, rgba(255,106,43,.09), transparent 26%), radial-gradient(circle at top left, rgba(255,255,255,.035), transparent 24%)",
            zIndex: -1,
          },
          "::selection": {
            background: "rgba(255,106,43,.28)",
          },
          "::-webkit-scrollbar": { width: 12, height: 12 },
          "::-webkit-scrollbar-track": {
            background: "rgba(255,255,255,.04)",
            borderRadius: 999,
          },
          "::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,.22)",
            borderRadius: 999,
            border: "2px solid rgba(7,9,13,.88)",
          },
          "::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255,255,255,.34)",
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: SURFACE,
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: SURFACE,
            backgroundImage: "none",
            border: "none",
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: "rgba(7,9,13,.78)",
            backdropFilter: "saturate(180%) blur(16px)",
            WebkitBackdropFilter: "saturate(180%) blur(16px)",
            borderBottom: `1px solid ${RULE}`,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingInline: 16,
            fontWeight: 700,
          },
          sizeLarge: { paddingInline: 20, paddingBlock: 10 },
          containedPrimary: {
            background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DEEP} 100%)`,
            color: ACCENT_INK,
            boxShadow: "0 14px 32px rgba(255,106,43,.22)",
            "&:hover": {
              background: `linear-gradient(135deg, ${ACCENT_DEEP} 0%, ${ACCENT} 100%)`,
            },
          },
          containedSecondary: {
            background: "rgba(255,255,255,.94)",
            color: "#0b0d10",
            "&:hover": { background: "#fff" },
          },
          outlined: {
            borderColor: RULE_STRONG,
            color: TEXT,
            background: "rgba(255,255,255,.03)",
            "&:hover": {
              borderColor: "rgba(255,255,255,.28)",
              background: "rgba(255,255,255,.06)",
            },
          },
          text: {
            color: TEXT_DIM,
            "&:hover": {
              background: "rgba(255,255,255,.04)",
              color: TEXT,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            color: TEXT_DIM,
            "&:hover": {
              background: "rgba(255,255,255,.07)",
              color: TEXT,
            },
          },
        },
      },
      MuiChip: {
        defaultProps: { size: "small" },
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0,
            paddingInline: 2,
          },
          outlined: {
            borderColor: RULE_STRONG,
            color: TEXT_DIM,
          },
          filled: {
            background: "rgba(255,255,255,.06)",
            color: TEXT,
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: SURFACE_INPUT,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: RULE,
              transition: "border-color .15s, box-shadow .15s",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: RULE_STRONG,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: ACCENT,
              boxShadow: "0 0 0 3px rgba(255,106,43,.10)",
              borderWidth: 1,
            },
            "& input": { color: TEXT },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: TEXT_DIM,
            "&.Mui-focused": { color: ACCENT },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: "#000",
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 8,
            paddingInline: 8,
            paddingBlock: 5,
          },
          arrow: { color: "#000" },
        },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: RULE } },
      },
      MuiAlert: {
        defaultProps: { variant: "filled" },
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 18,
            background: SURFACE_RAISED,
            backgroundImage: "none",
            border: `1px solid ${RULE}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            background: SURFACE_RAISED,
            borderRadius: 14,
            border: `1px solid ${RULE}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: 14,
            borderRadius: 10,
            marginInline: 6,
            marginBlock: 2,
            "&:hover": {
              background: "rgba(255,255,255,.06)",
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 700, fontSize: 14 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            height: 5,
            background: RULE,
          },
          bar: { borderRadius: 999, background: ACCENT },
        },
      },
      MuiCircularProgress: {
        styleOverrides: { root: { color: ACCENT } },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            "&.Mui-checked": { color: ACCENT },
            "&.Mui-checked + .MuiSwitch-track": {
              backgroundColor: ACCENT,
              opacity: 0.55,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: ACCENT, height: 2 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: 14,
            fontWeight: 600,
            textTransform: "none",
            color: TEXT_DIM,
            "&.Mui-selected": { color: TEXT },
            minHeight: 44,
          },
        },
      },
    },
  });
};

export const tokens = {
  bg: "var(--ff-bg)",
  surface: "var(--ff-surface)",
  surfaceRaised: "var(--ff-surface-raised)",
  surfaceInput: "var(--ff-surface-input)",
  rule: "var(--ff-rule)",
  ruleStrong: "var(--ff-rule-strong)",
  text: "var(--ff-text)",
  textDim: "var(--ff-text-dim)",
  textFaint: "var(--ff-text-faint)",
  accent: "var(--ff-accent)",
  accentDeep: "var(--ff-accent-deep)",
  accentInk: "var(--ff-accent-ink)",
  hoverSubtle: "var(--ff-hover-subtle)",
  overlayStrong: "var(--ff-overlay-strong)",
  overlaySoft: "var(--ff-overlay-soft)",
  glass: "var(--ff-glass)",
  glassHover: "var(--ff-glass-hover)",
  inverseSurface: "var(--ff-inverse-surface)",
  inverseText: "var(--ff-inverse-text)",
};
