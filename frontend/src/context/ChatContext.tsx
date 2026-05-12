import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  agentApi,
  chatApi,
  ChatMember,
  ChatMessageDto,
  MediaItem,
  getChatWebSocketUrl,
} from "@/services/api";

export interface ChatUser {
  id: string;
  name: string;
  /** display name when @-mentioned, lowercase, no spaces */
  handle: string;
  color: string;
  online: boolean;
  isBot?: boolean;
  isCurrentUser?: boolean;
  watching?: string;
  watchingMediaId?: string;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  text: string;
  ts: string;
  mentionedUserIds: string[];
  mentionedHandles: string[];
  mediaIds?: string[];
  mediaItems?: MediaItem[];
  /** reserved for future typing indicators */
  pending?: boolean;
}

interface WatchingNowPayload {
  mediaId: string;
  title: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  users: ChatUser[];
  currentUser: ChatUser;
  unreadCount: number;
  isBotTyping: boolean;
  loading: boolean;
  realtimeConnected: boolean;
  sendMessage: (text: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshChat: () => Promise<void>;
  resetChat: () => Promise<void>;
  setWatchingNow: (payload: WatchingNowPayload | null) => void;
}

const FALLBACK_POLL_MS = 60_000;

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const palette = [
  "#7c5cff",
  "#ec4899",
  "#22d3ee",
  "#facc15",
  "#22c55e",
  "#fb923c",
  "#a78bfa",
  "#38bdf8",
];

const FAM_AGENT_USER: ChatUser = {
  id: "fam-agent",
  name: "Fam",
  handle: "fam",
  color: "#ff6a2b",
  online: true,
  isBot: true,
};

const isFamMention = (text: string) => /(^|\s)@fam\b/i.test(text);

const createFamMessage = (text: string, pending = false): ChatMessage => ({
  id: `fam-${pending ? "pending" : "reply"}-${Date.now()}`,
  authorId: FAM_AGENT_USER.id,
  authorName: FAM_AGENT_USER.name,
  authorHandle: FAM_AGENT_USER.handle,
  text,
  ts: new Date().toISOString(),
  mentionedUserIds: [],
  mentionedHandles: [],
  mediaIds: [],
  mediaItems: [],
  pending,
});

const colorForId = (id: string) => {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return palette[sum % palette.length];
};

const fallbackHandle = (email?: string) =>
  (email?.split("@")[0] || "you").toLowerCase().replace(/[^a-z0-9_]+/g, "") ||
  "you";

const toChatUser = (member: ChatMember): ChatUser => ({
  id: member.id,
  name: member.name,
  handle: member.handle,
  color: colorForId(member.id),
  online: member.online,
  isBot: !!member.is_bot,
  isCurrentUser: member.is_current_user,
  watching: member.watching_title || undefined,
  watchingMediaId: member.watching_media_id || undefined,
});

const toChatMessage = (message: ChatMessageDto): ChatMessage => ({
  id: message.id,
  authorId: message.author_id,
  authorName: message.author_name,
  authorHandle: message.author_handle,
  text: message.text,
  ts: message.created_at,
  mentionedUserIds: message.mentioned_user_ids || [],
  mentionedHandles: message.mentioned_handles || [],
  mediaIds: message.media_ids || [],
  mediaItems: message.media_items || [],
});

const sortMessages = (items: ChatMessage[]) =>
  [...items].sort((a, b) => +new Date(a.ts) - +new Date(b.ts));

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const watchingRef = useRef<WatchingNowPayload | null>(null);

  const currentUser = useMemo<ChatUser>(() => {
    const loaded = users.find((u) => u.isCurrentUser);
    if (loaded) return loaded;

    if (!user) {
      return {
        id: "guest",
        name: "You",
        handle: "you",
        color: "#7c5cff",
        online: true,
        isCurrentUser: true,
      };
    }

    return {
      id: user.id,
      name: user.display_name || user.full_name || user.email.split("@")[0],
      handle: fallbackHandle(user.email),
      color: colorForId(user.id),
      online: true,
      isCurrentUser: true,
    };
  }, [user, users]);

  const upsertMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return sortMessages([...prev, message]);
    });
  }, []);

  const sendRealtime = useCallback((payload: object) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  const refreshChat = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setUsers([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const [membersRes, messagesRes, unreadRes] = await Promise.all([
        chatApi.users(),
        chatApi.messages({ limit: 100 }),
        chatApi.unread(),
      ]);
      setUsers(membersRes.data.map(toChatUser));
      setMessages(messagesRes.data.map(toChatMessage));
      setUnreadCount(unreadRes.data.unread_count);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshChat();
    if (!user) return;

    // Fallback only. WebSocket drives normal realtime updates, but this recovers
    // from missed events or temporary network reconnects.
    const id = window.setInterval(() => {
      void refreshChat();
    }, FALLBACK_POLL_MS);

    return () => window.clearInterval(id);
  }, [refreshChat, user]);

  useEffect(() => {
    if (!user || !token) {
      socketRef.current?.close();
      socketRef.current = null;
      setRealtimeConnected(false);
      return;
    }

    let stopped = false;
    let reconnectTimer: number | undefined;
    let attempts = 0;

    const connect = () => {
      if (stopped) return;

      const socket = new WebSocket(getChatWebSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        attempts = 0;
        setRealtimeConnected(true);
        socket.send(JSON.stringify({ type: "ping" }));
        if (watchingRef.current) {
          socket.send(
            JSON.stringify({
              type: "watching_update",
              media_id: watchingRef.current.mediaId,
              title: watchingRef.current.title,
            })
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "presence_snapshot" && Array.isArray(data.users)) {
            setUsers(data.users.map(toChatUser));
            return;
          }

          if (data.type === "presence_changed" && data.user?.id) {
            const incoming = data.user as {
              id: string;
              online?: boolean;
              watching_media_id?: string | null;
              watching_title?: string | null;
            };
            setUsers((prev) =>
              prev.map((u) =>
                u.id === incoming.id
                  ? {
                      ...u,
                      online: !!incoming.online,
                      watching: incoming.watching_title || undefined,
                      watchingMediaId: incoming.watching_media_id || undefined,
                    }
                  : u
              )
            );
            return;
          }

          if (data.type === "message_created" && data.message) {
            upsertMessage(toChatMessage(data.message as ChatMessageDto));
            return;
          }

          if (data.type === "unread_updated") {
            setUnreadCount(Number(data.unread_count || 0));
          }
        } catch {
          // Ignore malformed realtime events rather than breaking the UI.
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        setRealtimeConnected(false);
        if (stopped) return;
        attempts += 1;
        const delay = Math.min(1000 * 2 ** attempts, 15_000);
        reconnectTimer = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
      setRealtimeConnected(false);
    };
  }, [token, upsertMessage, user]);

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || !user) return;

      const shouldAskFam = isFamMention(text);

      const res = await chatApi.sendMessage(text);
      upsertMessage(toChatMessage(res.data));
      const unreadRes = await chatApi.unread();
      setUnreadCount(unreadRes.data.unread_count);

      if (!shouldAskFam) return;

      const pending = createFamMessage("", true);
      upsertMessage(pending);
      setIsBotTyping(true);

      try {
        const agentRes = await agentApi.chat(text, res.data.id);
        const agentMessage = agentRes.data.message
          ? toChatMessage(agentRes.data.message)
          : createFamMessage(agentRes.data.answer || "I could not answer that.");

        setMessages((prev) => {
          const withoutPending = prev.filter((m) => m.id !== pending.id);
          if (withoutPending.some((m) => m.id === agentMessage.id)) {
            return sortMessages(withoutPending);
          }
          return sortMessages(withoutPending.concat(agentMessage));
        });
      } catch {
        const errorReply = createFamMessage(
          "Sorry, I could not reach Fam assistant right now."
        );
        setMessages((prev) =>
          sortMessages(prev.filter((m) => m.id !== pending.id).concat(errorReply))
        );
      } finally {
        setIsBotTyping(false);
      }
    },
    [upsertMessage, user]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const latestMessageId = messages[messages.length - 1]?.id;
    const res = await chatApi.markRead(latestMessageId);
    setUnreadCount(res.data.unread_count);
  }, [messages, user]);

  const usersForChat = useMemo<ChatUser[]>(() => {
    const hasFam = users.some((u) => u.handle.toLowerCase() === FAM_AGENT_USER.handle);
    return hasFam ? users : [FAM_AGENT_USER, ...users];
  }, [users]);

  const setWatchingNow = useCallback(
    (payload: WatchingNowPayload | null) => {
      watchingRef.current = payload;
      if (payload) {
        sendRealtime({
          type: "watching_update",
          media_id: payload.mediaId,
          title: payload.title,
        });
      } else {
        sendRealtime({ type: "watching_clear" });
      }
    },
    [sendRealtime]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      users: usersForChat,
      currentUser,
      unreadCount,
      isBotTyping,
      loading,
      realtimeConnected,
      sendMessage,
      markAllRead,
      refreshChat,
      resetChat: refreshChat,
      setWatchingNow,
    }),
    [
      messages,
      usersForChat,
      currentUser,
      unreadCount,
      isBotTyping,
      loading,
      realtimeConnected,
      sendMessage,
      markAllRead,
      refreshChat,
      setWatchingNow,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};
