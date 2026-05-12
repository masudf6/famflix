import { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/PeopleOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { PresenceList } from "@/components/chat/PresenceList";
import { tokens } from "@/theme";

const Chat = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const {
    users,
    markAllRead,
    refreshChat,
    messages,
    loading,
    realtimeConnected,
    sendMessage,
  } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const [presenceOpen, setPresenceOpen] = useState(false);
  const lastAskHandledRef = useRef<string | null>(null);

  useEffect(() => {
    void markAllRead();
  }, [markAllRead, messages.length]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ask = params.get("ask")?.trim();
    if (!ask || lastAskHandledRef.current === ask) return;

    lastAskHandledRef.current = ask;

    (async () => {
      try {
        await sendMessage(ask);
      } finally {
        navigate("/chat", { replace: true });
      }
    })();
  }, [location.search, navigate, sendMessage]);

  const onlineCount = users.filter((user) => !user.isBot && user.online).length;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "flex-end" }}
        sx={{ mb: 3 }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "primary.main",
              mb: 0.75,
            }}
          >
            Family room
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
            Hey Fam!
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ fontSize: 13, color: "text.secondary" }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: realtimeConnected ? "#4ade80" : "text.disabled",
                boxShadow: realtimeConnected ? "0 0 0 2px rgba(74,222,128,.2)" : "none",
              }}
            />
            <Box>{onlineCount} online</Box>
          </Stack>
          <Box>·</Box>
          <Box>{messages.length} messages</Box>
          {!isDesktop && (
            <Tooltip title="Members">
              <IconButton size="small" onClick={() => setPresenceOpen(true)}>
                <GroupsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Refresh chat">
            <span>
              <IconButton size="small" onClick={() => void refreshChat()} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 290px" },
          height: {
            xs: "calc(100vh - 56px - 24px - 130px)",
            md: "calc(100vh - 64px - 64px - 110px)",
          },
          minHeight: 500,
          borderRadius: 3,
          border: `1px solid ${tokens.rule}`,
          background: tokens.surface,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.22)",
        }}
      >
        <Stack sx={{ minHeight: 0, borderRight: { md: `1px solid ${tokens.rule}` } }}>
          <MessageList />
          <Box sx={{ borderTop: `1px solid ${tokens.rule}` }}>
            <MessageInput />
          </Box>
        </Stack>

        {isDesktop && (
          <Box sx={{ minHeight: 0, background: tokens.bg }}>
            <PresenceList users={users} />
          </Box>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={presenceOpen}
        onClose={() => setPresenceOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            background: tokens.bg,
            borderLeft: `1px solid ${tokens.rule}`,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${tokens.rule}` }}
        >
          <Typography
            sx={{
              flex: 1,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Members
          </Typography>
          <IconButton size="small" onClick={() => setPresenceOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <PresenceList users={users} />
      </Drawer>
    </Container>
  );
};

export default Chat;
