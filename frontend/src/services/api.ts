import axios from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ===== Types =====
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  display_name?: string | null;
  role: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface MediaFile {
  id: string;
  s3_key: string;
  original_filename: string;
  content_type?: string | null;
  file_size_bytes?: number | null;
  duration_seconds?: number | null;
  created_at?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string | null;
  media_type: string;
  thumbnail_url?: string | null;
  thumbnail_s3_key?: string | null;
  uploaded_by?: string | null;
  is_public: boolean;
  release_year?: number | null;
  rating?: string | null;
  audience_rating?: string | null;
  genres: string[];
  tags: string[];
  created_at: string;
  file?: MediaFile | null;
}

export interface AccessLink {
  media_id: string;
  action: string;
  url: string;
}

export interface UploadUrlResponse {
  key: string;
  upload_url: string;
  expires_in: number;
}

export interface MediaListParams {
  q?: string;
  media_type?: string;
  genre?: string;
  tag?: string;
  sort_by?: "created_at" | "title" | "release_year" | "rating";
  sort_dir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ChatMember {
  id: string;
  name: string;
  handle: string;
  online: boolean;
  is_current_user: boolean;
  watching_media_id?: string | null;
  watching_title?: string | null;
  is_bot?: boolean;
}

export interface ChatMessageDto {
  id: string;
  author_id: string;
  author_name: string;
  author_handle: string;
  text: string;
  created_at: string;
  mentioned_user_ids: string[];
  mentioned_handles: string[];
  media_ids: string[];
  media_items: MediaItem[];
}

export interface ChatUnreadResponse {
  unread_count: number;
  last_read_message_id?: string | null;
  last_read_at?: string | null;
}

export interface AgentChatResponse {
  answer: string;
  media_ids: string[];
  media_items: MediaItem[];
  message?: ChatMessageDto | null;
}

// ===== Endpoints =====
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),
  register: (full_name: string, email: string, password: string) =>
    api.post("/auth/register", { full_name, email, password }),
  me: () => api.get<{ user: AuthUser }>("/auth/me"),
};

export const userApi = {
  me: () => api.get<{ user: AuthUser }>("/users/me"),
  updateMe: (payload: { display_name?: string | null }) =>
    api.patch<{ user: AuthUser }>("/users/me", payload),
  preferences: () => api.get<{ display_name?: string | null }>("/users/me/preferences"),
  updatePreferences: (payload: { display_name?: string | null }) =>
    api.patch<{ display_name?: string | null }>("/users/me/preferences", payload),
};


export const getChatWebSocketUrl = () => {
  const token = localStorage.getItem("auth_token") || "";
  const path = `${API_BASE_URL.replace(/\/$/, "")}/chat/ws`;

  let wsUrl: string;
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    const url = new URL(path);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = url.toString();
  } else {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${protocol}//${window.location.host}${path.startsWith("/") ? path : `/${path}`}`;
  }

  const separator = wsUrl.includes("?") ? "&" : "?";
  return `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
};

export const chatApi = {
  users: () => api.get<ChatMember[]>("/chat/users"),
  messages: (params?: { limit?: number; before?: string }) =>
    api.get<ChatMessageDto[]>("/chat/messages", { params }),
  sendMessage: (text: string) =>
    api.post<ChatMessageDto>("/chat/messages", { text }),
  unread: () => api.get<ChatUnreadResponse>("/chat/unread"),
  markRead: (last_read_message_id?: string) =>
    api.patch<ChatUnreadResponse>("/chat/read", { last_read_message_id }),
  myMentions: (params?: { limit?: number; unread_only?: boolean }) =>
    api.get<ChatMessageDto[]>("/chat/mentions/me", { params }),
};

export const agentApi = {
  chat: (text: string, sourceMessageId?: string) =>
    api.post<AgentChatResponse>("/agent/chat", {
      text,
      source_message_id: sourceMessageId,
    }),
};

export const mediaApi = {
  list: (params?: MediaListParams) => api.get<MediaItem[]>("/media", { params }),
  get: (id: string) => api.get<MediaItem>(`/media/${id}`),
  stream: (id: string) => api.get<AccessLink>(`/media/${id}/stream`),
  download: (id: string) => api.get<AccessLink>(`/media/${id}/download`),
};

export const adminApi = {
  uploadUrl: (filename: string, content_type: string, media_type: string) =>
    api.post<UploadUrlResponse>("/admin/media/upload-url", {
      filename,
      content_type,
      media_type,
    }),
  createMedia: (payload: {
    title: string;
    description?: string;
    media_type: string;
    thumbnail_url?: string;
    is_public?: boolean;
    release_year?: number;
    rating?: string;
    audience_rating?: string;
    genres?: string[];
    tags?: string[];
    file: {
      s3_key: string;
      original_filename: string;
      content_type?: string;
      file_size_bytes?: number;
      duration_seconds?: number;
    };
  }) => api.post<MediaItem>("/admin/media", payload),
  deleteMedia: (id: string) => api.delete(`/admin/media/${id}`),
};
