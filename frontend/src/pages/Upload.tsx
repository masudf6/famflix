import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PublicIcon from "@mui/icons-material/PublicOutlined";
import { adminApi } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { tokens } from "@/theme";

const formatBytes = (b: number) => {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

type Stage = "idle" | "signing" | "uploading" | "saving";

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const getMediaDuration = (file: File): Promise<number | null> => {
  if (!file.type.startsWith("video") && !file.type.startsWith("audio")) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = file.type.startsWith("audio")
      ? document.createElement("audio")
      : document.createElement("video");

    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    el.src = url;
  });
};

const Upload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "series">("movie");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [rating, setRating] = useState("");
  const [audienceRating, setAudienceRating] = useState("");
  const [genresText, setGenresText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const onFile = async (f: File | null) => {
    setFile(f);
    setDurationSeconds(null);
    if (f) {
      if (!title) {
        const n = f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
        setTitle(n.charAt(0).toUpperCase() + n.slice(1));
      }
      const duration = await getMediaDuration(f);
      setDurationSeconds(duration);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] || null;
    if (f) void onFile(f);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please pick a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const year = releaseYear.trim() ? Number(releaseYear.trim()) : undefined;
    if (year && (Number.isNaN(year) || year < 1888 || year > 2100)) {
      setError("Release year must be between 1888 and 2100.");
      return;
    }

    setError(null);
    setProgress(0);

    try {
      setStage("signing");
      const presign = await adminApi.uploadUrl(
        file.name,
        file.type || "application/octet-stream",
        mediaType
      );

      setStage("uploading");
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presign.data.upload_url);
        if (file.type) xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else
            reject(
              new Error(
                `S3 upload failed (${xhr.status}). ${xhr.responseText || ""}`
              )
            );
        };
        xhr.onerror = () =>
          reject(new Error("Browser couldn't reach S3. Check CORS / region."));
        xhr.onabort = () => reject(new Error("Upload aborted."));
        xhr.send(file);
      });

      setStage("saving");
      const created = await adminApi.createMedia({
        title: title.trim(),
        description: description || undefined,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        is_public: true,
        release_year: year,
        rating: rating.trim() || undefined,
        audience_rating: audienceRating.trim() || undefined,
        genres: splitCsv(genresText),
        tags: splitCsv(tagsText),
        file: {
          s3_key: presign.data.key,
          original_filename: file.name,
          content_type: file.type || undefined,
          file_size_bytes: file.size,
          duration_seconds: durationSeconds || undefined,
        },
      });

      setStage("idle");
      navigate(`/media/${created.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Upload failed.");
      setStage("idle");
    }
  };

  const busy = stage !== "idle";

  const previewSrc = useMemo(() => {
    if (thumbnailUrl.trim()) return thumbnailUrl.trim();
    if (file && file.type.startsWith("image")) return URL.createObjectURL(file);
    return null;
  }, [file, thumbnailUrl]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Stack spacing={1} sx={{ mb: 5 }}>
        <Box
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "primary.main",
          }}
        >
          Admin
        </Box>
        <Typography variant="h2" sx={{ letterSpacing: "-0.025em" }}>
          Add to library
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: "60ch" }}>
          Files upload directly to S3 via a presigned URL — they don't pass
          through this app.
        </Typography>
      </Stack>

      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          display: "grid",
          gap: { xs: 3, md: 5 },
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
        }}
      >
        {/* Form column */}
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {!file ? (
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              component="label"
              sx={{
                position: "relative",
                p: { xs: 5, md: 7 },
                textAlign: "center",
                border: "1.5px dashed",
                borderColor: dragOver ? "primary.main" : tokens.rule,
                borderRadius: 3,
                background: dragOver
                  ? "rgba(255,106,43,.05)"
                  : tokens.surface,
                transition: "border-color .2s, background .2s",
                cursor: "pointer",
                "&:hover": { borderColor: tokens.ruleStrong },
              }}
            >
              <input
                type="file"
                hidden
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  void onFile(e.target.files?.[0] || null)
                }
              />
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: "rgba(255,106,43,.10)",
                  color: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CloudUploadIcon />
              </Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Drag a file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse — a film or series file
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${tokens.rule}`,
                background: tokens.surface,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: "rgba(255,106,43,.10)",
                  color: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <InsertDriveFileIcon fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(file.size)}
                  {file.type ? ` · ${file.type}` : ""}
                  {durationSeconds ? ` · ${Math.round(durationSeconds / 60)}m` : ""}
                </Typography>
              </Box>
              {!busy && (
                <IconButton size="small" onClick={() => void onFile(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            disabled={busy}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={busy}
          />
          <TextField
            select
            label="Type"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "movie" | "series")}
            fullWidth
            disabled={busy}
          >
            <MenuItem value="movie">Film</MenuItem>
            <MenuItem value="series">Series</MenuItem>
          </TextField>

          <TextField
            label="Thumbnail URL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            fullWidth
            disabled={busy}
            helperText="Optional poster/backdrop image URL."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Release year"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              fullWidth
              disabled={busy}
              inputProps={{ inputMode: "numeric" }}
            />
            <TextField
              label="Rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              fullWidth
              disabled={busy}
              placeholder="8.5, 4/5, etc."
            />
            <TextField
              label="Audience"
              value={audienceRating}
              onChange={(e) => setAudienceRating(e.target.value)}
              fullWidth
              disabled={busy}
              placeholder="PG, M, Family, etc."
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Genres"
              value={genresText}
              onChange={(e) => setGenresText(e.target.value)}
              fullWidth
              disabled={busy}
              placeholder="Action, Comedy, Drama"
            />
            <TextField
              label="Tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              fullWidth
              disabled={busy}
              placeholder="Weekend, Kids, Dad's pick"
            />
          </Stack>

          {busy && (
            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{
                  fontSize: 13,
                  color: "text.secondary",
                  mb: 0.75,
                }}
              >
                <Box>
                  {stage === "signing" && "Requesting upload URL…"}
                  {stage === "uploading" && "Uploading to S3…"}
                  {stage === "saving" && "Saving metadata…"}
                </Box>
                <Box>{stage === "uploading" && `${progress}%`}</Box>
              </Stack>
              <LinearProgress
                variant={stage === "uploading" ? "determinate" : "indeterminate"}
                value={progress}
              />
            </Box>
          )}

          <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={busy || !file || !title.trim()}
              startIcon={
                busy ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {busy ? "Uploading…" : "Add to library"}
            </Button>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate(-1)}
              disabled={busy}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>

        {/* Preview column */}
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 2,
            }}
          >
            Preview
          </Typography>
          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              background: tokens.surface,
              border: `1px solid ${tokens.rule}`,
            }}
          >
            <Box
              sx={{
                aspectRatio: "16/9",
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "hidden",
                background: previewSrc
                  ? undefined
                  : "linear-gradient(135deg, hsl(180,30%,20%) 0%, hsl(220,30%,12%) 100%)",
              }}
            >
              {previewSrc ? (
                <Box
                  component="img"
                  src={previewSrc}
                  alt=""
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Typography color="text.secondary">No thumbnail</Typography>
              )}
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <PublicIcon sx={{ fontSize: 16, color: "success.main" }} />
                <Typography variant="caption" color="text.secondary">
                  Available to all registered users
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 0.5 }}>
                {title || "Untitled"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {description || "No description yet."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mediaType === "series" ? "Series" : "Film"}
                {releaseYear ? ` · ${releaseYear}` : ""}
                {rating ? ` · ${rating}` : ""}
                {audienceRating ? ` · ${audienceRating}` : ""}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Upload;
