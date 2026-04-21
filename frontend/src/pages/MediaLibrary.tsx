import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { mediaApi, MediaItem } from "@/services/api";
import { MediaCard } from "@/components/MediaCard";

const MediaLibrary = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mediaApi
      .list()
      .then((res) => setItems(res.data))
      .catch((e) =>
        setError(e?.response?.data?.detail || "Failed to load media")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Library</Typography>
        <Typography color="text.secondary">
          Your family's private collection
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Alert severity="info">No media yet. Upload something to get started.</Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        {items.map((m) => (
          <MediaCard key={m.id} media={m} />
        ))}
      </Box>
    </Stack>
  );
};

export default MediaLibrary;