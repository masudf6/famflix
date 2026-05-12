import { ReactNode } from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import { ChatUser } from "@/context/ChatContext";
import { tokens } from "@/theme";

interface Props {
  users: ChatUser[];
}

const StatusDot = ({ online }: { online: boolean }) => (
  <Box
    sx={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      flexShrink: 0,
      bgcolor: online ? "#4ade80" : tokens.textFaint,
      boxShadow: online ? "0 0 0 2px rgba(74,222,128,.18)" : "none",
    }}
  />
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      px: 2.5,
      pt: 2.5,
      pb: 1.25,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "text.secondary",
    }}
  >
    {children}
  </Box>
);

const Row = ({ user }: { user: ChatUser }) => (
  <Stack
    direction="row"
    spacing={1.5}
    alignItems="center"
    sx={{
      px: 2.5,
      py: 1.25,
      borderRadius: 1,
      mx: 1,
      "&:hover": { background: tokens.hoverSubtle },
    }}
  >
    <Avatar
      sx={{
        width: 30,
        height: 30,
        bgcolor: user.isBot ? tokens.accent : user.color,
        color: user.isBot ? "#ffffff" : "#fff",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {user.isBot ? (
        <SmartToyIcon sx={{ fontSize: 16 }} />
      ) : (
        user.name[0].toUpperCase()
      )}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 13.5,
            color: "text.primary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </Typography>
        {user.isCurrentUser && (
          <Box
            sx={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            you
          </Box>
        )}
      </Stack>
      <Typography
        sx={{
          fontSize: 11.5,
          color: "text.secondary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {user.isBot
          ? "Recommendations bot"
          : user.watching
          ? `Watching · ${user.watching}`
          : `@${user.handle}`}
      </Typography>
    </Box>
    <StatusDot online={user.online} />
  </Stack>
);

export const PresenceList = ({ users }: Props) => {
  const bots = users.filter((u) => u.isBot);
  const humansOnline = users.filter((u) => !u.isBot && u.online);
  const humansOffline = users.filter((u) => !u.isBot && !u.online);

  return (
    <Box sx={{ height: "100%", overflowY: "auto" }}>
      {bots.length > 0 && (
        <>
          <SectionLabel>Bot</SectionLabel>
          {bots.map((u) => (
            <Row key={u.id} user={u} />
          ))}
        </>
      )}

      <SectionLabel>
        Online — {humansOnline.length.toString().padStart(2, "0")}
      </SectionLabel>
      {humansOnline.length === 0 ? (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            fontSize: 12.5,
            color: "text.secondary",
          }}
        >
          No one's around.
        </Box>
      ) : (
        humansOnline.map((u) => <Row key={u.id} user={u} />)
      )}

      {humansOffline.length > 0 && (
        <>
          <SectionLabel>
            Offline — {humansOffline.length.toString().padStart(2, "0")}
          </SectionLabel>
          {humansOffline.map((u) => (
            <Row key={u.id} user={u} />
          ))}
        </>
      )}

      <Box
        sx={{
          mx: 2.5,
          mt: 3,
          mb: 2,
          p: 2,
          borderRadius: 1.5,
          border: `1px solid ${tokens.rule}`,
          background: "rgba(255,106,43,.06)",
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tokens.accent,
            mb: 0.75,
          }}
        >
          Tip
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.5 }}>
          Type <strong>@fam</strong> to ask the assistant, or <strong>@</strong> to mention someone.
        </Typography>
      </Box>
    </Box>
  );
};
