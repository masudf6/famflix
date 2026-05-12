import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { MediaItem } from "@/services/api";
import { tokens } from "@/theme";

interface Props {
  item: MediaItem;
}

const formatRuntime = (seconds?: number | null) => {
  if (!seconds) return "Runtime n/a";
  const min = Math.max(1, Math.round(seconds / 60));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const kindLabel = (kind: string) => {
  const value = kind.toLowerCase();
  if (["series", "show", "tv", "tv show"].includes(value)) return "Series";
  if (["documentary", "doc"].includes(value)) return "Documentary";
  if (value === "short") return "Short";
  if (["movie", "film"].includes(value)) return "Film";
  return kind || "Media";
};

const yearFor = (item: MediaItem) =>
  item.release_year || new Date(item.created_at).getFullYear();

const fallbackPoster =
  "linear-gradient(135deg, rgba(255,106,43,.28) 0%, rgba(255,161,94,.22) 100%)";

export const MediaSuggestionCard = ({ item }: Props) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const year = yearFor(item);
  const runtime = formatRuntime(item.file?.duration_seconds);
  const rating = item.rating || item.audience_rating || "Library pick";

  const openDetails = () => navigate(`/media/${item.id}`);

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        sx={{
          width: 210,
          flexShrink: 0,
          cursor: "pointer",
          borderRadius: 1.5,
          overflow: "hidden",
          background: tokens.surface,
          border: `1px solid ${tokens.rule}`,
          transition: "transform .2s, border-color .2s, box-shadow .2s",
          "&:hover": {
            transform: "translateY(-2px)",
            borderColor: tokens.ruleStrong,
            boxShadow: "0 12px 28px -8px rgba(0,0,0,.55)",
          },
          "&:hover .sc-play": { opacity: 1 },
        }}
      >
        <Box
          sx={{
            position: "relative",
            aspectRatio: "16/9",
            background: item.thumbnail_url ? "#111" : fallbackPoster,
            overflow: "hidden",
          }}
        >
          {item.thumbnail_url && (
            <Box
              component="img"
              src={item.thumbnail_url}
              alt={item.title}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,.7) 0%, rgba(0,0,0,.08) 65%)",
            }}
          />
          <Box
            className="sc-play"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              opacity: 0,
              transition: "opacity .2s",
              background: "rgba(0,0,0,.3)",
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: tokens.inverseSurface,
                color: tokens.inverseText,
                display: "grid",
                placeItems: "center",
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 22, ml: 0.2 }} />
            </Box>
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#fff",
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              background: "rgba(0,0,0,.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            {kindLabel(item.media_type)}
          </Box>
          <Box
            sx={{
              position: "absolute",
              left: 10,
              right: 10,
              bottom: 8,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              textShadow: "0 2px 8px rgba(0,0,0,.5)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </Box>
        </Box>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            px: 1.25,
            py: 1,
            fontSize: 11.5,
            color: "text.secondary",
          }}
          divider={
            <Box
              sx={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                bgcolor: "text.secondary",
                opacity: 0.6,
              }}
            />
          }
        >
          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ minWidth: 0 }}>
            <StarIcon sx={{ fontSize: 12, color: tokens.accent }} />
            <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rating}
            </Box>
          </Stack>
          <Box>{runtime}</Box>
          <Box>{year}</Box>
        </Stack>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        <Box
          sx={{
            position: "relative",
            aspectRatio: "16/9",
            background: item.thumbnail_url ? "#111" : fallbackPoster,
            overflow: "hidden",
          }}
        >
          {item.thumbnail_url && (
            <Box
              component="img"
              src={item.thumbnail_url}
              alt={item.title}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background:
                `linear-gradient(to top, ${tokens.overlayStrong} 0%, ${tokens.overlaySoft} 55%, transparent 100%)`,
            }}
          />
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(0,0,0,.5)",
              color: "#fff",
              backdropFilter: "blur(6px)",
              "&:hover": { background: "rgba(0,0,0,.7)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box
            sx={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: 24,
              color: "#fff",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label={kindLabel(item.media_type)}
                size="small"
                sx={{
                  background: "rgba(0,0,0,.5)",
                  color: "#fff",
                  fontWeight: 600,
                  backdropFilter: "blur(6px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: 10,
                }}
              />
              <Box sx={{ fontSize: 13, opacity: 0.85 }}>{year}</Box>
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: 26, md: 32 },
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                textShadow: "0 2px 16px rgba(0,0,0,.5)",
              }}
            >
              {item.title}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction="row"
            spacing={2.5}
            divider={<Box sx={{ width: 1, alignSelf: "stretch", bgcolor: tokens.rule }} />}
            sx={{ mb: 2.5, fontSize: 13, color: "text.secondary" }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StarIcon sx={{ fontSize: 14, color: tokens.accent }} />
              <Box sx={{ color: "text.primary", fontWeight: 600 }}>{rating}</Box>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              <Box sx={{ color: "text.primary" }}>{runtime}</Box>
            </Stack>
            {item.audience_rating && (
              <Box sx={{ color: "text.primary" }}>{item.audience_rating}</Box>
            )}
          </Stack>

          <Typography sx={{ color: "text.primary", lineHeight: 1.65, mb: 2.5 }}>
            {item.description || "No description has been added for this title yet."}
          </Typography>

          {(item.genres.length > 0 || item.tags.length > 0) && (
            <Stack spacing={1.5}>
              {item.genres.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Box
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      width: 64,
                      flexShrink: 0,
                    }}
                  >
                    Genres
                  </Box>
                  {item.genres.map((g) => (
                    <Chip key={g} label={g} variant="outlined" size="small" />
                  ))}
                </Stack>
              )}
              {item.tags.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <Box
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      width: 64,
                      flexShrink: 0,
                    }}
                  >
                    Tags
                  </Box>
                  {item.tags.map((m) => (
                    <Chip key={m} label={m} size="small" />
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          <Button
            fullWidth
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={openDetails}
            sx={{ mt: 3 }}
          >
            Open details
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
