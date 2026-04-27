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
  role: string;
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
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string | null;
  media_type: string;
  thumbnail_url?: string | null;
  uploaded_by?: string | null;
  is_public: boolean;
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

// ===== Endpoints =====
export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),
  register: (full_name: string, email: string, password: string) =>
    api.post("/auth/register", { full_name, email, password }),
  me: () => api.get<{ user: AuthUser }>("/media/me"),
};

export const mediaApi = {
  list: () => api.get<MediaItem[]>("/media"),
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
    file: {
      s3_key: string;
      original_filename: string;
      content_type?: string;
      file_size_bytes?: number;
    };
  }) => api.post<MediaItem>("/admin/media", payload),
};