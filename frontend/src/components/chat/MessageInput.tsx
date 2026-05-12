import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Avatar,
  Box,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import { useChat } from "@/context/ChatContext";
import { tokens } from "@/theme";

interface MentionState {
  active: boolean;
  query: string;
  startIndex: number;
}

const initialMention: MentionState = { active: false, query: "", startIndex: -1 };

export const MessageInput = () => {
  const { sendMessage, users } = useChat();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mention, setMention] = useState<MentionState>(initialMention);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const mentionables = useMemo(() => {
    const list = users.filter((u) => !u.isCurrentUser);
    // Bot first, then alphabetical.
    return [
      ...list.filter((u) => u.isBot),
      ...list.filter((u) => !u.isBot),
    ];
  }, [users]);

  const filtered = useMemo(() => {
    if (!mention.active) return [];
    const q = mention.query.toLowerCase();
    return mentionables.filter(
      (u) =>
        u.handle.toLowerCase().startsWith(q) ||
        u.name.toLowerCase().startsWith(q)
    );
  }, [mention, mentionables]);

  useEffect(() => {
    setActiveIdx(0);
  }, [mention.query, mention.active]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart ?? value.length;

    let i = caret - 1;
    while (i >= 0 && /[a-zA-Z0-9_]/.test(value[i])) i--;
    if (i >= 0 && value[i] === "@" && (i === 0 || /\s/.test(value[i - 1]))) {
      const query = value.slice(i + 1, caret);
      setMention({ active: true, query, startIndex: i });
    } else {
      setMention(initialMention);
    }
  };

  const insertMention = (handle: string) => {
    if (!mention.active) return;
    const before = text.slice(0, mention.startIndex);
    const afterCaret = text.slice(
      inputRef.current?.selectionStart ?? text.length
    );
    const next = `${before}@${handle} ${afterCaret}`;
    setText(next);
    setMention(initialMention);
    requestAnimationFrame(() => {
      const pos = before.length + handle.length + 2;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const next = text.trim();
    if (!next || sending) return;
    setSending(true);
    setText("");
    setMention(initialMention);
    try {
      await sendMessage(next);
    } catch {
      setText(next);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention.active && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filtered[activeIdx].handle);
        return;
      }
      if (e.key === "Escape") {
        setMention(initialMention);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <Box sx={{ position: "relative", px: { xs: 2, md: 3 }, py: 2 }}>
      {mention.active && filtered.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            position: "absolute",
            bottom: "calc(100% - 4px)",
            left: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            maxWidth: 320,
            maxHeight: 240,
            overflowY: "auto",
            zIndex: 10,
            borderRadius: 1.5,
            border: `1px solid ${tokens.rule}`,
            background: tokens.surfaceRaised,
          }}
        >
          <List dense disablePadding>
            {filtered.map((u, i) => (
              <ListItemButton
                key={u.id}
                selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => insertMention(u.handle)}
                sx={{
                  py: 0.75,
                  borderRadius: 0,
                  "&.Mui-selected": {
                    background: "rgba(255,106,43,.10)",
                    "&:hover": { background: "rgba(255,106,43,.14)" },
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: u.isBot ? tokens.accent : u.color,
                    color: u.isBot ? "#ffffff" : "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    mr: 1.25,
                  }}
                >
                  {u.isBot ? (
                    <SmartToyIcon sx={{ fontSize: 14 }} />
                  ) : (
                    u.name[0].toUpperCase()
                  )}
                </Avatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={0.75} alignItems="baseline">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        @{u.handle}
                      </Typography>
                      {u.isBot && (
                        <Box
                          sx={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: tokens.accent,
                            textTransform: "uppercase",
                          }}
                        >
                          bot
                        </Box>
                      )}
                    </Stack>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ letterSpacing: 0 }}
                    >
                      {u.name}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          border: `1px solid ${tokens.rule}`,
          background: tokens.surface,
          "&:focus-within": { borderColor: tokens.accent },
          transition: "border-color .15s",
        }}
      >
        <InputBase
          inputRef={inputRef}
          multiline
          maxRows={5}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder="Send a message — type @fam to ask the assistant…"
          sx={{ flex: 1, fontSize: 14, color: "text.primary" }}
        />
        <Tooltip title="Send (↵)">
          <span>
            <IconButton
              onClick={() => void submit()}
              disabled={!text.trim() || sending}
              size="small"
              sx={{
                ml: 0.5,
                color: text.trim() ? tokens.accent : "text.secondary",
                "&:hover": {
                  background: text.trim() ? "rgba(255,106,43,.14)" : "transparent",
                },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>
    </Box>
  );
};
