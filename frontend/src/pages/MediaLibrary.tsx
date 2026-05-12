import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  InputBase,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/ArrowUpward";
import BoltIcon from "@mui/icons-material/Bolt";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import GroupsIcon from "@mui/icons-material/PeopleOutlined";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloudUploadIcon from "@mui/icons-material/CloudUploadOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { mediaApi, MediaItem } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { tokens } from "@/theme";

const fallbackPoster = (title: string) => {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `radial-gradient(circle at 80% 20%, hsla(${hue}, 80%, 58%, .22), transparent 30%), linear-gradient(135deg, hsl(${hue}, 45%, 18%) 0%, hsl(${(hue + 34) % 360}, 30%, 9%) 100%)`;
};

const mediaBackground = (media: MediaItem) =>
  media.thumbnail_url
    ? `url(${media.thumbnail_url}) center/cover no-repeat`
    : fallbackPoster(media.title);

const isSeries = (media: MediaItem) => {
  const type = (media.media_type || "").toLowerCase();
  return type === "series" || type === "show" || type === "tv";
};

const metaLabel = (media: MediaItem) => {
  const parts = [
    isSeries(media) ? "TV" : "Movie",
    media.release_year ? String(media.release_year) : null,
    media.audience_rating || media.rating || null,
  ].filter(Boolean);
  return parts.join(" · ");
};

const FeaturedPanel = ({ media }: { media: MediaItem }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 360, md: 430 },
        borderRadius: 4,
        overflow: "hidden",
        border: `1px solid ${tokens.rule}`,
        background: mediaBackground(media),
        backgroundPosition: "center center",
        boxShadow: "0 30px 90px rgba(0,0,0,.26)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(7,9,13,.94) 0%, rgba(7,9,13,.70) 42%, rgba(7,9,13,.18) 100%), linear-gradient(0deg, rgba(7,9,13,.60) 0%, transparent 56%)",
        }}
      />

      <Stack
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          minHeight: { xs: 360, md: 430 },
          justifyContent: "center",
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 5 },
          maxWidth: 620,
        }}
      >
        <Typography
          sx={{
            color: "primary.main",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          Featured
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 800,
            lineHeight: 0.95,
            textShadow: "0 2px 18px rgba(0,0,0,.45)",
            mb: 2,
          }}
        >
          {media.title}
        </Typography>
        {media.description && (
          <Typography
            sx={{
              color: "rgba(237,241,247,.82)",
              maxWidth: "48ch",
              fontSize: { xs: 14, md: 16 },
              lineHeight: 1.7,
              mb: 3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {media.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate(`/media/${media.id}`)}
          >
            Play
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate("/#my-list")}
            sx={{
              background: "rgba(255,255,255,.05)",
              backdropFilter: "blur(8px)",
            }}
          >
            My List
          </Button>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 16,
          zIndex: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            sx={{
              width: i === 0 ? 22 : 18,
              height: 4,
              borderRadius: 99,
              bgcolor: i === 0 ? "primary.main" : "rgba(255,255,255,.22)",
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

const moodPrompts = [
  {
    label: "Something exciting",
    prompt: "Recommend something exciting for tonight",
    icon: <BoltIcon fontSize="small" />,
  },
  {
    label: "Feel-good movie",
    prompt: "Recommend a feel-good movie",
    icon: <FavoriteBorderIcon fontSize="small" />,
  },
  {
    label: "Mind-bending show",
    prompt: "Recommend a mind-bending show",
    icon: <PsychologyIcon fontSize="small" />,
  },
  {
    label: "Family night",
    prompt: "Recommend something for family night",
    icon: <GroupsIcon fontSize="small" />,
  },
];

const AskFamPanel = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const ask = (value = prompt) => {
    const next = value.trim();
    if (!next) return;
    navigate(`/chat?ask=${encodeURIComponent(`@fam ${next}`)}`);
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: { xs: 340, md: 430 },
        borderRadius: 4,
        border: `1px solid ${tokens.rule}`,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 100% 0%, rgba(255,106,43,.14), transparent 32%), linear-gradient(145deg, rgba(13,17,23,.96) 0%, rgba(7,9,13,.98) 100%)",
        boxShadow: "0 30px 90px rgba(0,0,0,.22)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.02) 0%, transparent 28%)",
          pointerEvents: "none",
        }}
      />
      <Stack
        component="form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          ask();
        }}
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          minHeight: { xs: 340, md: 430 },
          justifyContent: "center",
          p: { xs: 3, md: 4 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              background: "rgba(255,106,43,.08)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-.03em" }}>
            Ask Fam
          </Typography>
        </Stack>

        <Typography sx={{ color: "text.secondary", maxWidth: 350, mb: 3 }}>
          Not sure what to watch? Ask anything. We will recommend something you will love.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: `1px solid ${tokens.ruleStrong}`,
            borderRadius: 3,
            background: "rgba(255,255,255,.045)",
            px: 1.1,
            py: 0.85,
            mb: 2.1,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
            "&:focus-within": {
              borderColor: tokens.accent,
              boxShadow: "0 0 0 3px rgba(255,106,43,.10)",
            },
          }}
        >
          <InputBase
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What are you in the mood for?"
            sx={{
              flex: 1,
              minWidth: 0,
              color: "text.primary",
              fontSize: 15,
              px: 0.9,
              py: 0.8,
            }}
          />
          <IconButton
            type="submit"
            disabled={!prompt.trim()}
            sx={{
              width: 42,
              height: 42,
              flexShrink: 0,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,.08)",
                color: "text.secondary",
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.1,
          }}
        >
          {moodPrompts.map((item) => (
            <Chip
              key={item.label}
              icon={item.icon}
              label={item.label}
              variant="outlined"
              onClick={() => ask(item.prompt)}
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                height: 38,
                px: 0.6,
                color: "text.primary",
                borderColor: tokens.ruleStrong,
                background: "rgba(255,255,255,.03)",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
                "& .MuiChip-icon": { color: "primary.main", fontSize: 18, ml: 0.2 },
                "&:hover": {
                  color: "text.primary",
                  background: "rgba(255,255,255,.06)",
                  borderColor: "rgba(255,255,255,.22)",
                },
              }}
            />
          ))}
        </Box>
      </Stack>
    </Box>
  );
};

const SectionTitle = ({ id, title }: { id: string; title: string }) => (
  <Stack id={id} direction="row" alignItems="center" spacing={0.4} sx={{ mb: 1.35, scrollMarginTop: 96 }}>
    <Typography
      sx={{
        fontSize: { xs: 19, md: 21 },
        fontWeight: 800,
        letterSpacing: "-0.03em",
      }}
    >
      {title}
    </Typography>
    <ChevronRightIcon sx={{ color: "primary.main", fontSize: 24 }} />
  </Stack>
);

const PosterCard = ({ media, wide = false }: { media: MediaItem; wide?: boolean }) => {
  const navigate = useNavigate();

  return (
    <Box
      onClick={() => navigate(`/media/${media.id}`)}
      sx={{
        flex: "0 0 auto",
        width: wide ? { xs: 270, sm: 330, md: 360 } : { xs: 200, sm: 230, md: 250 },
        cursor: "pointer",
        scrollSnapAlign: "start",
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: wide ? "16 / 8.8" : "16 / 9",
          borderRadius: 2.6,
          overflow: "hidden",
          border: `1px solid ${tokens.rule}`,
          background: mediaBackground(media),
          backgroundSize: "cover",
          backgroundPosition: "center center",
          transition: "transform .2s ease, box-shadow .2s ease, filter .2s ease",
          boxShadow: "0 8px 20px rgba(0,0,0,.12)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 45px rgba(0,0,0,.34)",
            filter: "brightness(1.02)",
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, rgba(7,9,13,.28) 0%, rgba(7,9,13,.06) 45%, rgba(7,9,13,.06) 100%)",
          }}
        />
      </Box>

      <Box sx={{ px: 0.2, pt: 1 }}>
        <Typography
          sx={{
            color: "text.primary",
            fontSize: wide ? 15 : 14,
            fontWeight: 700,
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: wide ? 38 : 36,
          }}
        >
          {media.title}
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            color: "text.secondary",
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {metaLabel(media)}
        </Typography>
      </Box>
    </Box>
  );
};

const MediaRow = ({ id, title, items, wide = false }: { id: string; title: string; items: MediaItem[]; wide?: boolean }) => {
  if (items.length === 0) return null;
  return (
    <Box sx={{ mb: { xs: 3.2, md: 3.8 } }}>
      <SectionTitle id={id} title={title} />
      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.6, md: 1.8 },
          overflowX: "auto",
          pb: 0.4,
          px: 0.1,
          scrollSnapType: "x proximity",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {items.map((media) => (
          <PosterCard key={media.id} media={media} wide={wide} />
        ))}
      </Box>
    </Box>
  );
};

const EmptyLibrary = ({ isAdmin }: { isAdmin: boolean }) => (
  <Container maxWidth="md" sx={{ py: 10 }}>
    <Box
      sx={{
        border: `1px solid ${tokens.rule}`,
        borderRadius: 4,
        background: tokens.surface,
        textAlign: "center",
        p: { xs: 4, md: 6 },
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        Your library is empty
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 3 }}>
        Upload a movie or show to start building your FamFlix home screen.
      </Typography>
      {isAdmin && (
        <Button component={RouterLink} to="/upload" variant="contained" startIcon={<CloudUploadIcon />}>
          Upload media
        </Button>
      )}
    </Box>
  </Container>
);

const MediaLibrary = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    mediaApi
      .list()
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load library"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("search") === "1") {
      setSearchOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!location.hash) return;
    requestAnimationFrame(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [items.length, location.hash]);

  const sortedByDate = useMemo(
    () => items.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [items]
  );

  const featured = sortedByDate[0];
  const continueWatching = sortedByDate.slice(0, 8);
  const movies = useMemo(() => sortedByDate.filter((item) => !isSeries(item)), [sortedByDate]);
  const tv = useMemo(() => sortedByDate.filter(isSeries), [sortedByDate]);
  const myList = useMemo(
    () => sortedByDate.filter((_, index) => index % 3 === 0).slice(0, 12),
    [sortedByDate]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.genres || []).some((genre) => genre.toLowerCase().includes(q)) ||
        (item.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [items, query]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 14 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (items.length === 0) {
    return <EmptyLibrary isAdmin={isAdmin} />;
  }

  return (
    <Box sx={{ pb: { xs: 6, md: 8 } }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2.5, md: 3.5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.7fr) minmax(380px, .9fr)" },
            gap: { xs: 2.2, md: 3 },
            alignItems: "stretch",
            mb: { xs: 3, md: 3.7 },
          }}
        >
          {featured && <FeaturedPanel media={featured} />}
          <AskFamPanel />
        </Box>

        <MediaRow id="continue" title="Continue Watching" items={continueWatching} wide />
        <MediaRow id="movies" title="Movies" items={movies.slice(0, 18)} />
        <MediaRow id="tv" title="TV" items={tv.slice(0, 18)} />
        <MediaRow id="my-list" title="My List" items={myList} />
      </Container>

      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setQuery("");
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            background: tokens.surfaceRaised,
            borderRadius: 3,
            mt: 6,
            alignSelf: "flex-start",
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${tokens.rule}` }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search movies, TV, genres…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <DialogContent sx={{ p: 2 }}>
          {!query.trim() ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              Start typing to search your FamFlix library.
            </Typography>
          ) : searchResults.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              No results for “{query}”.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              {searchResults.map((item) => (
                <Box
                  key={item.id}
                  component={RouterLink}
                  to={`/media/${item.id}`}
                  onClick={() => setSearchOpen(false)}
                  sx={{ textDecoration: "none" }}
                >
                  <Box
                    sx={{
                      aspectRatio: "16/9",
                      borderRadius: 2,
                      border: `1px solid ${tokens.rule}`,
                      background: mediaBackground(item),
                      backgroundSize: "cover",
                      backgroundPosition: "center center",
                      mb: 1,
                    }}
                  />
                  <Typography noWrap sx={{ color: "text.primary", fontWeight: 700 }}>
                    {item.title}
                  </Typography>
                  <Typography noWrap sx={{ color: "text.secondary", fontSize: 12 }}>
                    {metaLabel(item)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MediaLibrary;
