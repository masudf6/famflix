import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import { mediaApi, MediaItem } from "@/services/api";

const MediaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
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

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!media) return null;

  const isVideo = (media.media_type || "").toLowerCase().includes("video") ||
    (media.file?.content_type || "").startsWith("video");
  const isAudio = (media.media_type || "").toLowerCase().includes("audio") ||
    (media.file?.content_type || "").startsWith("audio");

  return (
    <Stack spacing={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ alignSelf: "flex-start" }}
      >
        Back
      </Button>

      <Box
        sx={{
          bgcolor: "black",
          borderRadius: 2,
          overflow: "hidden",
          aspectRatio: isAudio ? undefined : "16/9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {streamUrl && isVideo && (
          <video
            src={streamUrl}
            controls
            autoPlay
            style={{ width: "100%", height: "100%" }}
          />
        )}
        {streamUrl && isAudio && (
          <audio src={streamUrl} controls style={{ width: "100%" }} />
        )}
        {streamUrl && !isVideo && !isAudio && (
          <Box sx={{ p: 6, color: "white" }}>
            <Typography>Preview not available for this media type.</Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {media.title}
        </Typography>
        <Chip label={media.media_type} />
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? "Preparing..." : "Download"}
        </Button>
      </Stack>

      {media.description && (
        <Typography color="text.secondary">{media.description}</Typography>
      )}
    </Stack>
  );
};

export default MediaDetail;