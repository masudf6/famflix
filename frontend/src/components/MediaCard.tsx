import { Card, CardActionArea, CardContent, CardMedia, Chip, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { MediaItem } from "@/services/api";

export const MediaCard = ({ media }: { media: MediaItem }) => {
  const navigate = useNavigate();
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#7c5cff'/><stop offset='1' stop-color='#22d3ee'/></linearGradient></defs><rect width='400' height='225' fill='url(#g)'/><text x='50%' y='50%' fill='white' font-family='sans-serif' font-size='28' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${media.title.slice(0, 30)}</text></svg>`
    );
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardActionArea onClick={() => navigate(`/media/${media.id}`)} sx={{ flex: 1 }}>
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            image={media.thumbnail_url || fallback}
            alt={media.title}
            sx={{ aspectRatio: "16/9", objectFit: "cover" }}
          />
          <PlayCircleIcon
            sx={{
              position: "absolute",
              right: 8,
              bottom: 8,
              fontSize: 40,
              color: "white",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,.6))",
            }}
          />
        </Box>
        <CardContent>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
            {media.title}
          </Typography>
          <Box sx={{ mt: 0.5, display: "flex", gap: 0.5 }}>
            <Chip size="small" label={media.media_type} />
            {!media.is_public && <Chip size="small" label="private" color="warning" />}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};