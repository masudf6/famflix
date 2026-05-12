import { Box, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";
import { MediaItem } from "@/services/api";

interface Props {
  media: MediaItem;
  /** Poster aspect ratio. "16/9" for landscape thumbs, "2/3" for portrait posters. */
  aspect?: "16/9" | "2/3";
  /** Larger title (used for hero/featured cards). */
  size?: "sm" | "md";
}

const colourFor = (s: string) => {
  // Stable pseudo-random hue from the title so posters without thumbnails
  // still feel distinct and never grey.
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 35%, 18%)`;
};

const fallbackPoster = (title: string, aspect: "16/9" | "2/3") => {
  const w = aspect === "2/3" ? 400 : 640;
  const h = aspect === "2/3" ? 600 : 360;
  const bg = colourFor(title);
  const initial = title.trim()[0]?.toUpperCase() || "·";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>` +
        `<rect width='${w}' height='${h}' fill='${bg}'/>` +
        `<text x='50%' y='50%' fill='rgba(255,255,255,.18)' font-family='Inter, sans-serif' font-weight='700' font-size='${
          aspect === "2/3" ? 220 : 180
        }' text-anchor='middle' dominant-baseline='middle'>${initial}</text>` +
        `</svg>`
    )
  );
};

export const MediaCard = ({ media, aspect = "16/9", size = "sm" }: Props) => {
  const navigate = useNavigate();
  const meta: string[] = [];
  if (media.media_type) meta.push(media.media_type);
  if (media.release_year) meta.push(String(media.release_year));
  if (media.audience_rating) meta.push(media.audience_rating);
  if (media.file?.duration_seconds)
    meta.push(`${Math.round(media.file.duration_seconds / 60)}m`);

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/media/${media.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/media/${media.id}`);
      }}
      sx={{
        position: "relative",
        cursor: "pointer",
        outline: "none",
        "&:focus-visible .poster": {
          boxShadow: "0 0 0 2px var(--ff-accent)",
        },
        "&:hover .poster": {
          transform: "translateY(-2px)",
          boxShadow:
            "0 12px 28px -8px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08)",
        },
        "&:hover .play-overlay": { opacity: 1 },
        "&:hover .poster-img": { transform: "scale(1.04)" },
      }}
    >
      <Box
        className="poster"
        sx={{
          position: "relative",
          aspectRatio: aspect,
          borderRadius: 1.5,
          overflow: "hidden",
          background: colourFor(media.title),
          transition: "transform .25s ease, box-shadow .25s ease",
        }}
      >
        <Box
          component="img"
          className="poster-img"
          src={media.thumbnail_url || fallbackPoster(media.title, aspect)}
          alt={media.title}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .4s ease",
          }}
        />
        {/* shade for legibility */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,0) 45%)",
            pointerEvents: "none",
          }}
        />
        {/* hover play */}
        <Box
          className="play-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            transition: "opacity .2s ease",
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.35)",
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--ff-inverse-surface)",
              color: "var(--ff-inverse-text)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 6px 20px rgba(0,0,0,.5)",
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 28, ml: 0.3 }} />
          </Box>
        </Box>
      </Box>
      <Stack spacing={0.5} sx={{ pt: 1.25, px: 0.25 }}>
        <Typography
          sx={{
            fontSize: size === "md" ? 16 : 14,
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            letterSpacing: "-0.01em",
          }}
        >
          {media.title}
        </Typography>
        {meta.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              fontSize: 12,
              color: "text.secondary",
            }}
            divider={
              <Box
                sx={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  bgcolor: "text.secondary",
                  alignSelf: "center",
                  opacity: 0.6,
                }}
              />
            }
          >
            {meta.map((m) => (
              <Box key={m} sx={{ textTransform: "capitalize" }}>
                {m}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
