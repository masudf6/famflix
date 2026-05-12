import { Avatar, Box, Stack, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import { ChatMessage, useChat } from "@/context/ChatContext";
import { MediaSuggestionCard } from "./MediaSuggestionCard";
import { tokens } from "@/theme";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Split text into plain segments, @mention chips, and clickable links. */
const renderText = (text: string, isOwn: boolean, knownHandles: string[]) => {
  const parts: Array<{ kind: "text" | "mention" | "link"; value: string }> = [];
  const re = /(@[a-z0-9_]+|https?:\/\/[^\s]+|\/media\/[a-f0-9-]+(?:\/(?:stream|download))?)/gi;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ kind: "text", value: text.slice(last, match.index) });
    }
    const value = match[0];
    parts.push({ kind: value.startsWith("@") ? "mention" : "link", value });
    last = match.index + value.length;
  }

  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });

  return parts.map((p, i) => {
    if (p.kind === "text") {
      return (
        <span key={i} style={{ whiteSpace: "pre-wrap" }}>
          {p.value}
        </span>
      );
    }

    if (p.kind === "link") {
      return (
        <Box
          key={i}
          component="a"
          href={p.value}
          sx={{
            color: isOwn ? "rgba(255,255,255,.96)" : tokens.accent,
            fontWeight: 700,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            overflowWrap: "anywhere",
          }}
        >
          {p.value}
        </Box>
      );
    }

    const handle = p.value.slice(1);
    const known = knownHandles.includes(handle.toLowerCase());
    const isBot = handle.toLowerCase() === "fam";
    return (
      <Box
        key={i}
        component="span"
        sx={{
          display: "inline-block",
          px: 0.7,
          py: 0,
          mx: 0.15,
          borderRadius: 0.75,
          fontWeight: 600,
          fontSize: "0.92em",
          color: isOwn
            ? "rgba(255,255,255,.96)"
            : isBot
            ? tokens.accent
            : "text.primary",
          background: isOwn
            ? "rgba(255,255,255,.16)"
            : isBot
            ? "rgba(255,106,43,.16)"
            : known
            ? tokens.hoverSubtle
            : tokens.hoverSubtle,
        }}
      >
        @{handle}
      </Box>
    );
  });
};


export const MessageBubble = ({ message, isOwn }: Props) => {
  const { users } = useChat();
  const author = users.find((u) => u.id === message.authorId);
  const knownHandles = users.map((u) => u.handle.toLowerCase());
  const isBot = !!author?.isBot || message.authorHandle.toLowerCase() === "fam";
  const displayName = author?.name || message.authorName || "Unknown";
  const avatarColor = isBot ? tokens.accent : author?.color || tokens.textDim;

  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "flex-start",
        flexDirection: isOwn ? "row-reverse" : "row",
        mb: 0.5,
      }}
    >
      <Avatar
        sx={{
          width: 30,
          height: 30,
          // Bot avatar uses the accent regardless of seed colour.
          bgcolor: avatarColor,
          color: isBot ? "#ffffff" : "#fff",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {isBot ? (
          <SmartToyIcon sx={{ fontSize: 16 }} />
        ) : (
          displayName[0]?.toUpperCase() || "?"
        )}
      </Avatar>

      <Box sx={{ maxWidth: { xs: "82%", md: "70%" }, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="baseline"
          sx={{
            mb: 0.25,
            justifyContent: isOwn ? "flex-end" : "flex-start",
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 13,
              color: isBot ? tokens.accent : "text.primary",
            }}
          >
            {displayName}
          </Typography>
          {isBot && (
            <Box
              sx={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: tokens.accent,
                border: `1px solid ${tokens.accent}`,
                borderRadius: 0.5,
                px: 0.5,
                py: "1px",
                lineHeight: 1.3,
              }}
            >
              bot
            </Box>
          )}
          <Typography
            sx={{
              fontSize: 11,
              color: "text.secondary",
              opacity: 0.7,
            }}
          >
            {formatTime(message.ts)}
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: isOwn
              ? tokens.accent
              : isBot
              ? "rgba(255,106,43,.08)"
              : tokens.surface,
            color: isOwn ? "#ffffff" : "text.primary",
            border: 1,
            borderColor: isOwn
              ? "transparent"
              : isBot
              ? "rgba(255,106,43,.22)"
              : tokens.rule,
            wordBreak: "break-word",
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {message.pending ? (
            <Box sx={{ display: "flex", gap: 0.5, py: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: tokens.textDim,
                    animation: "famflix-typing 1.2s infinite",
                    animationDelay: `${i * 0.15}s`,
                    "@keyframes famflix-typing": {
                      "0%, 60%, 100%": { opacity: 0.3, transform: "translateY(0)" },
                      "30%": { opacity: 1, transform: "translateY(-3px)" },
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            renderText(message.text, isOwn, knownHandles)
          )}
        </Box>

        {!!message.mediaItems?.length && (
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              mt: 1.25,
              overflowX: "auto",
              pb: 1,
              justifyContent: isOwn ? "flex-end" : "flex-start",
              "&::-webkit-scrollbar": { height: 6 },
            }}
          >
            {message.mediaItems.map((item) => (
              <MediaSuggestionCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};
