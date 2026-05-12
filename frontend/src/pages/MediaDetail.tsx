import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DownloadIcon from "@mui/icons-material/DownloadOutlined";
import ShareIcon from "@mui/icons-material/IosShareOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatIcon from "@mui/icons-material/ChatBubbleOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { adminApi, mediaApi, MediaItem } from "@/services/api";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { MediaCard } from "@/components/MediaCard";
import { tokens } from "@/theme";

const formatDuration = (s?: number | null) => {
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatBytes = (b?: number | null) => {
  if (!b) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
};

const fallbackBackdrop = (title: string) => {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 45%, 22%) 0%, hsl(${
    (hue + 40) % 360
  }, 35%, 12%) 100%)`;
};

const MetaItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Box sx={{ minWidth: 0 }}>
    <Box
      sx={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "text.secondary",
        mb: 0.5,
      }}
    >
      {label}
    </Box>
    <Box sx={{ fontSize: 14, color: "text.primary", wordBreak: "break-word" }}>
      {value || (
        <Box component="span" sx={{ color: "text.secondary" }}>
          —
        </Box>
      )}
    </Box>
  </Box>
);

const MediaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setWatchingNow } = useChat();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [related, setRelated] = useState<MediaItem[]>([]);
  const [playing, setPlaying] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPlaying(false);
    Promise.all([mediaApi.get(id), mediaApi.stream(id)])
      .then(([m, s]) => {
        setMedia(m.data);
        setStreamUrl(s.data.url);
      })
      .catch((e) =>
        setError(e?.response?.data?.detail || "Failed to load media")
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    mediaApi
      .list()
      .then((res) =>
        setRelated(
          res.data
            .filter((m) => m.id !== id)
            .sort(
              (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
            )
            .slice(0, 5)
        )
      )
      .catch(() => setRelated([]));
  }, [id]);

  const onDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      const res = await mediaApi.download(id);
      window.open(res.data.url, "_blank");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const onShare = async () => {
    if (!media) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: media.title, url });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const onDelete = async () => {
    if (!media) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await adminApi.deleteMedia(media.id);
      navigate("/", { replace: true });
    } catch (e: any) {
      setDeleteError(e?.response?.data?.detail || "Failed to delete media");
    } finally {
      setDeleting(false);
    }
  };

  const isVideo = useMemo(
    () =>
      (media?.media_type || "").toLowerCase().includes("video") ||
      (media?.file?.content_type || "").startsWith("video"),
    [media]
  );
  const isAudio = useMemo(
    () =>
      (media?.media_type || "").toLowerCase().includes("audio") ||
      (media?.file?.content_type || "").startsWith("audio"),
    [media]
  );

  useEffect(() => {
    if (!media) return;

    if (playing) {
      setWatchingNow({ mediaId: media.id, title: media.title });
    } else {
      setWatchingNow(null);
    }

    return () => setWatchingNow(null);
  }, [media, playing, setWatchingNow]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 14 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  if (!media) return null;

  const backdropBg = media.thumbnail_url
    ? `url(${media.thumbnail_url}) center/cover no-repeat`
    : fallbackBackdrop(media.title);

  return (
    <Box>
      {/* Backdrop hero */}
      {!playing && (
        <Box
          sx={{
            position: "relative",
            height: { xs: 320, sm: 420, md: 520 },
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: backdropBg,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(0px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                `linear-gradient(to top, ${tokens.bg} 0%, ${tokens.overlayStrong} 30%, transparent 70%, ${tokens.overlaySoft} 100%)`,
            }}
          />
          <Container
            maxWidth="xl"
            sx={{
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              pt: 3,
              pb: { xs: 4, md: 6 },
            }}
          >
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{
                alignSelf: "flex-start",
                background: tokens.glass,
                backdropFilter: "blur(6px)",
                border: `1px solid ${tokens.rule}`,
                color: "text.primary",
                "&:hover": { background: tokens.glassHover },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Box sx={{ mt: "auto", maxWidth: 720 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Chip
                  label={(() => {
                    const t = (media.media_type || "").toLowerCase();
                    if (t === "series" || t === "show" || t === "tv") return "Series";
                    return "Film";
                  })()}
                  size="small"
                  sx={{
                    background: tokens.glass,
                    color: "text.primary",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: 10.5,
                  }}
                />
                <Box
                  sx={{
                    fontSize: 13,
                    color: "rgba(231,234,239,.75)",
                  }}
                >
                  Added{" "}
                  {new Date(media.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Box>
              </Stack>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  fontSize: { xs: "2rem", sm: "2.75rem", md: "3.5rem" },
                  lineHeight: 1,
                  mb: 2,
                  textShadow: "0 2px 16px rgba(0,0,0,.5)",
                }}
              >
                {media.title}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setPlaying(true)}
                  disabled={!isVideo && !isAudio}
                  sx={{ fontWeight: 600 }}
                >
                  Play
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={onDownload}
                  disabled={downloading}
                  sx={{
                    background: tokens.glass,
                    backdropFilter: "blur(6px)",
                    borderColor: tokens.ruleStrong,
                    color: "text.primary",
                    "&:hover": {
                      background: tokens.glassHover,
                      borderColor: tokens.ruleStrong,
                    },
                  }}
                >
                  {downloading ? "Preparing…" : "Download"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={shareCopied ? <CheckIcon /> : <ShareIcon />}
                  onClick={onShare}
                  sx={{
                    background: tokens.glass,
                    backdropFilter: "blur(6px)",
                    borderColor: tokens.ruleStrong,
                    color: "text.primary",
                    "&:hover": {
                      background: tokens.glassHover,
                      borderColor: tokens.ruleStrong,
                    },
                  }}
                >
                  {shareCopied ? "Copied" : "Share"}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setDeleteError(null);
                      setDeleteDialogOpen(true);
                    }}
                    sx={{
                      background: "rgba(244,67,54,.12)",
                      backdropFilter: "blur(6px)",
                      borderColor: "rgba(244,67,54,.35)",
                      color: "#ffb4ab",
                      "&:hover": {
                        background: "rgba(244,67,54,.2)",
                        borderColor: "rgba(244,67,54,.55)",
                      },
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Stack>
            </Box>
          </Container>
        </Box>
      )}

      {/* Player when playing */}
      {playing && (
        <Container maxWidth="lg" sx={{ pt: 3 }}>
          <IconButton
            size="small"
            onClick={() => setPlaying(false)}
            sx={{ mb: 2 }}
          >
            <ArrowBackIcon fontSize="small" />
            <Box component="span" sx={{ ml: 1, fontSize: 14 }}>
              Back to details
            </Box>
          </IconButton>
          <Box
            sx={{
              position: "relative",
              background: "#000",
              borderRadius: 2,
              overflow: "hidden",
              aspectRatio: isAudio ? "auto" : "16/9",
              minHeight: isAudio ? 80 : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isVideo && streamUrl && (
              <video
                src={streamUrl}
                controls
                autoPlay
                onEnded={() => setPlaying(false)}
                style={{ width: "100%", height: "100%" }}
              />
            )}
            {isAudio && streamUrl && (
              <Box sx={{ width: "100%", p: 3 }}>
                <audio
                  src={streamUrl}
                  controls
                  onEnded={() => setPlaying(false)}
                  style={{ width: "100%" }}
                />
              </Box>
            )}
          </Box>
        </Container>
      )}

      {/* Below-the-fold detail */}
      <Container maxWidth="xl" sx={{ pb: 8 }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 320px" },
            mt: { xs: 0, md: 4 },
          }}
        >
          <Box>
            {media.description && (
              <Typography
                sx={{
                  fontSize: { xs: 15, md: 16 },
                  color: "text.primary",
                  lineHeight: 1.7,
                  maxWidth: "70ch",
                  mb: 4,
                }}
              >
                {media.description}
              </Typography>
            )}
            <Button
              variant="text"
              component={RouterLink}
              to="/chat"
              startIcon={<ChatIcon />}
              sx={{ pl: 0, color: "primary.main" }}
            >
              Discuss in chat
            </Button>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${tokens.rule}`,
              background: tokens.surface,
              alignSelf: "start",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "text.secondary",
                mb: 2.5,
              }}
            >
              Details
            </Typography>
            <Stack spacing={2.5}>
              <MetaItem
                label="Type"
                value={
                  <Box sx={{ textTransform: "capitalize" }}>
                    {media.media_type}
                  </Box>
                }
              />
              <MetaItem label="Release year" value={media.release_year} />
              <MetaItem label="Rating" value={media.rating} />
              <MetaItem label="Audience" value={media.audience_rating} />
              {media.genres?.length > 0 && (
                <MetaItem
                  label="Genres"
                  value={
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {media.genres.map((genre) => (
                        <Chip key={genre} label={genre} size="small" />
                      ))}
                    </Stack>
                  }
                />
              )}
              {media.tags?.length > 0 && (
                <MetaItem
                  label="Tags"
                  value={
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {media.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  }
                />
              )}
              <MetaItem
                label="Added"
                value={new Date(media.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              {media.file && (
                <>
                  <MetaItem
                    label="Filename"
                    value={
                      <Box
                        sx={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                          fontSize: 13,
                        }}
                      >
                        {media.file.original_filename}
                      </Box>
                    }
                  />
                  <MetaItem
                    label="Duration"
                    value={formatDuration(media.file.duration_seconds)}
                  />
                  <MetaItem
                    label="Size"
                    value={formatBytes(media.file.file_size_bytes)}
                  />
                  <MetaItem
                    label="Format"
                    value={
                      media.file.content_type ? (
                        <Box
                          sx={{
                            fontFamily:
                              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                            fontSize: 13,
                          }}
                        >
                          {media.file.content_type}
                        </Box>
                      ) : null
                    }
                  />
                </>
              )}
            </Stack>
          </Box>
        </Box>

        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.015em",
                mb: 2.5,
              }}
            >
              More from your library
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: { xs: 1.5, md: 2 },
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(5, 1fr)",
                },
              }}
            >
              {related.map((m) => (
                <MediaCard key={m.id} media={m} aspect="16/9" />
              ))}
            </Box>
          </Box>
        )}
      </Container>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleting) setDeleteDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete media?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will permanently remove <strong>{media.title}</strong> from FamFlix.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The database record and stored media file will be deleted. This cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onDelete}
            disabled={deleting}
            startIcon={<DeleteIcon />}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaDetail;
