import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/context/ChatContext";
import { mockCatalog } from "@/data/mockCatalog";
import { tokens } from "@/theme";

interface Prefs {
  displayName: string;
  notifyOnMention: boolean;
  notifyOnNewLibraryItem: boolean;
  autoplayNext: boolean;
  reduceMotion: boolean;
}

const defaultPrefs = (displayName = ""): Prefs => ({
  displayName,
  notifyOnMention: true,
  notifyOnNewLibraryItem: true,
  autoplayNext: false,
  reduceMotion: false,
});

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <Box
    sx={{
      flex: 1,
      minWidth: 140,
      p: 2.5,
      borderRadius: 2,
      background: tokens.surface,
      border: `1px solid ${tokens.rule}`,
    }}
  >
    <Box
      sx={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "text.secondary",
        mb: 1,
      }}
    >
      {label}
    </Box>
    <Typography
      sx={{
        fontSize: 28,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
      }}
    >
      {value}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {hint}
      </Typography>
    )}
  </Box>
);

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const { messages, currentUser, resetChat } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "settings" ? 0 : 0;
  const [tab, setTab] = useState(initialTab);

  const initialDisplayName =
    user?.display_name || user?.full_name || user?.email?.split("@")[0] || currentUser.name || "";
  const [prefs, setPrefs] = useState<Prefs>(() => defaultPrefs(initialDisplayName));
  const [savedFlash, setSavedFlash] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    setPrefs((p) => ({ ...p, displayName: initialDisplayName }));
  }, [initialDisplayName]);

  const stats = useMemo(() => {
    const myMessages = messages.filter((m) => m.authorId === currentUser.id);
    const recommendationsReceived = messages
      .filter((m) => !!m.mediaIds?.length)
      .reduce((acc, m) => acc + (m.mediaIds?.length || 0), 0);
    return {
      messagesSent: myMessages.length,
      recommendationsReceived,
      titlesInLibrary: mockCatalog.length,
    };
  }, [messages, currentUser.id]);

  const recentActivity = useMemo(() => {
    return messages
      .filter((m) => m.authorId === currentUser.id)
      .slice(-5)
      .reverse();
  }, [messages, currentUser.id]);

  const handleCopyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const onTabChange = (_: any, v: number) => {
    setTab(v);
    if (v === 0) setSearchParams({ tab: "settings" });
    else setSearchParams({});
  };

  const onPrefChange = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        display_name: prefs.displayName.trim() || null,
      });
      setSavedFlash(true);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="warning">Not signed in.</Alert>
      </Container>
    );
  }

  const displayName = prefs.displayName || user.display_name || user.full_name || user.email.split("@")[0];
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ md: "center" }}
        sx={{ mb: 5 }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            background: "linear-gradient(135deg, #ff6a2b 0%, #ff844f 100%)",
            color: "#ffffff",
            fontSize: 32,
            fontWeight: 700,
            boxShadow: "0 0 32px rgba(255,106,43,.2)",
          }}
        >
          {(displayName || user.email)[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "primary.main",
              mb: 0.5,
            }}
          >
            {user.role === "admin" ? "Admin" : "Family member"}
          </Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 700, letterSpacing: "-0.025em", mb: 0.5 }}
          >
            {displayName}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
            <IconButton
              size="small"
              onClick={handleCopyEmail}
              sx={{ p: 0.5 }}
            >
              {emailCopied ? (
                <CheckIcon sx={{ fontSize: 14, color: "success.main" }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" component={RouterLink} to="/chat">
            Open chat
          </Button>
          <Button
            variant="text"
            onClick={() => setSignOutOpen(true)}
            startIcon={<LogoutIcon />}
          >
            Sign out
          </Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Stack
        direction="row"
        spacing={2}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 5 }}
      >
        {/* <Stat
          label="Messages"
          value={stats.messagesSent}
          hint="sent in family chat"
        />
        <Stat
          label="Picks received"
          value={stats.recommendationsReceived}
          hint="from recommendations"
        />
        <Stat
          label="On the shelf"
          value={stats.titlesInLibrary}
          hint="titles in mock catalog"
        /> */}
        <Stat
          label="Joined"
          value={joinedDate}
          hint="member since"
        />
      </Stack>

      <Tabs
        value={tab}
        onChange={onTabChange}
        sx={{
          mb: 4,
          borderBottom: `1px solid ${tokens.rule}`,
        }}
      >
        <Tab label="Settings" />
        {/* <Tab label="Activity" /> */}
        
      </Tabs>

      {tab === 0 && (
        <Box>
          <SettingSection title="Identity" note="How your name appears.">
            <TextField
              label="Display name"
              value={prefs.displayName}
              onChange={(e) => onPrefChange("displayName", e.target.value)}
              fullWidth
              size="small"
              sx={{ maxWidth: 360 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={saveProfile}
              disabled={savingProfile || prefs.displayName.trim() === (user.display_name || user.full_name || "")}
              sx={{ mt: 1.5 }}
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
            <Box sx={{ fontSize: 13, color: "text.secondary", mt: 1.5 }}>
              Email: {user.email}
              <Box component="span" sx={{ ml: 1.5, opacity: 0.7 }}>
                (managed by your administrator)
              </Box>
            </Box>
          </SettingSection>

          {/* <SettingSection title="Notifications" note="What earns a badge.">
            <ToggleRow
              title="Mentions in chat"
              description="@your-name in the family room"
              value={prefs.notifyOnMention}
              onChange={(v) => onPrefChange("notifyOnMention", v)}
            />
            <ToggleRow
              title="New library items"
              description="When someone uploads to the family shelf"
              value={prefs.notifyOnNewLibraryItem}
              onChange={(v) => onPrefChange("notifyOnNewLibraryItem", v)}
            />
          </SettingSection> */}

          {/* <SettingSection title="Playback" note="How the player behaves.">
            <ToggleRow
              title="Auto-play next"
              description="Queue up the next item from your library"
              value={prefs.autoplayNext}
              onChange={(v) => onPrefChange("autoplayNext", v)}
            />
            <ToggleRow
              title="Reduce motion"
              description="Tame hover transitions and crossfades"
              value={prefs.reduceMotion}
              onChange={(v) => onPrefChange("reduceMotion", v)}
            />
          </SettingSection> */}

          {/* <SettingSection
            title="Danger zone"
            note="Things you can't easily undo."
            danger
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems="flex-start"
            >
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAltIcon />}
                onClick={() => setResetOpen(true)}
              >
                Reset family chat
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={() => setSignOutOpen(true)}
              >
                Sign out everywhere
              </Button>
            </Stack>
          </SettingSection> */}
        </Box>
      )}

      {/* {tab === 1 && (
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 2,
            }}
          >
            Recent messages
          </Typography>
          {recentActivity.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
                border: `1px dashed ${tokens.rule}`,
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 0.5 }}>
                Nothing yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drop into the family chat to leave a message.{" "}
                <Box
                  component={RouterLink}
                  to="/chat"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Open chat →
                </Box>
              </Typography>
            </Box>
          ) : (
            <Stack
              divider={<Divider />}
              sx={{
                background: tokens.surface,
                borderRadius: 2,
                border: `1px solid ${tokens.rule}`,
              }}
            >
              {recentActivity.map((m) => (
                <Stack
                  key={m.id}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ p: 2 }}
                >
                  <Box
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      width: 100,
                      flexShrink: 0,
                      pt: 0.25,
                    }}
                  >
                    {new Date(m.ts).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Box>
                  <Typography sx={{ flex: 1, fontSize: 14 }}>
                    {m.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      )} */}

      <Dialog open={signOutOpen} onClose={() => setSignOutOpen(false)}>
        <DialogTitle>Sign out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You'll need to sign in again to see the family library and chat.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignOutOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setSignOutOpen(false);
              logout();
              navigate("/login");
            }}
          >
            Sign out
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset family chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This wipes the chat history in your browser and restores the seed
            conversation. Mock data only — nothing leaves this device.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => {
              resetChat();
              setResetOpen(false);
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={savedFlash}
        autoHideDuration={1600}
        onClose={() => setSavedFlash(false)}
        message="Saved"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
};

const SettingSection = ({
  title,
  note,
  children,
  danger,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
  danger?: boolean;
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "240px 1fr" },
      gap: { xs: 1.5, md: 4 },
      py: 4,
      borderTop: `1px solid ${tokens.rule}`,
    }}
  >
    <Box>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: danger ? "error.main" : "text.primary",
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "32ch" }}>
        {note}
      </Typography>
    </Box>
    <Box>{children}</Box>
  </Box>
);

const ToggleRow = ({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <Stack
    direction="row"
    spacing={2}
    alignItems="center"
    sx={{
      py: 1.5,
      "&:not(:last-of-type)": {
        borderBottom: `1px solid ${tokens.rule}`,
      },
    }}
  >
    <Box sx={{ flex: 1 }}>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
    <Switch
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
  </Stack>
);

export default Profile;
