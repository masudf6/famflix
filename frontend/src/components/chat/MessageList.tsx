import { useEffect, useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import { useChat } from "@/context/ChatContext";
import { MessageBubble } from "./MessageBubble";
import { tokens } from "@/theme";

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dayLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

export const MessageList = () => {
  const { messages, currentUser, isBotTyping } = useChat();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isBotTyping]);

  let lastDate: Date | null = null;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        px: { xs: 2, md: 3 },
        py: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        {messages.length === 0 && (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            No messages yet. Start the family chat below.
          </Box>
        )}
        {messages.map((m) => {
          const d = new Date(m.ts);
          const showDivider = !lastDate || !sameDay(lastDate, d);
          lastDate = d;
          return (
            <Box key={m.id}>
              {showDivider && (
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ my: 2.5 }}
                >
                  <Box sx={{ flex: 1, height: 1, bgcolor: tokens.rule }} />
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {dayLabel(d)}
                  </Typography>
                  <Box sx={{ flex: 1, height: 1, bgcolor: tokens.rule }} />
                </Stack>
              )}
              <MessageBubble message={m} isOwn={m.authorId === currentUser.id} />
            </Box>
          );
        })}
        {isBotTyping && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ pl: 1, color: "text.secondary" }}
          >
            <SmartToyIcon sx={{ fontSize: 14, color: tokens.accent }} />
            <Typography
              variant="caption"
              sx={{
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              Typing…
            </Typography>
          </Stack>
        )}
      </Stack>
      <div ref={endRef} />
    </Box>
  );
};
