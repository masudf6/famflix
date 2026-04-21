import { ChangeEvent, FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { adminApi } from "@/services/api";
import { useNavigate } from "react-router-dom";

const guessMediaType = (file: File): string => {
  if (file.type.startsWith("video")) return "video";
  if (file.type.startsWith("audio")) return "audio";
  if (file.type.startsWith("image")) return "image";
  return "other";
};

const Upload = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState("video");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "signing" | "uploading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setMediaType(guessMediaType(f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
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
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          reject(
            new Error(
              `S3 upload failed. Status: ${xhr.status}. Response: ${xhr.responseText || "No response body"}`
            )
          );
        };

        xhr.onerror = () =>
          reject(
            new Error(
              "Browser could not reach S3. This is usually an S3 CORS, bucket region, or presigned URL issue."
            )
          );

        xhr.onabort = () => reject(new Error("Upload was aborted"));
        xhr.send(file);
      });

      setStage("saving");
      const created = await adminApi.createMedia({
        title: title.trim(),
        description: description || undefined,
        media_type: mediaType,
        file: {
          s3_key: presign.data.key,
          original_filename: file.name,
          content_type: file.type || undefined,
          file_size_bytes: file.size,
        },
      });

      setStage("idle");
      navigate(`/media/${created.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Upload failed");
      setStage("idle");
    }
  };

  const busy = stage !== "idle";

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
      <Box>
        <Typography variant="h4">Upload media</Typography>
        <Typography color="text.secondary">
          Add a new video, audio, or image to the family library
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={3}
                fullWidth
              />
              <TextField
                select
                label="Media type"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                fullWidth
              >
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>

              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
              >
                {file ? file.name : "Choose file"}
                <input type="file" hidden onChange={onFile} />
              </Button>

              {busy && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {stage === "signing" && "Requesting upload URL..."}
                    {stage === "uploading" && `Uploading... ${progress}%`}
                    {stage === "saving" && "Saving metadata..."}
                  </Typography>
                  <LinearProgress
                    variant={stage === "uploading" ? "determinate" : "indeterminate"}
                    value={progress}
                  />
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={busy || !file || !title}
                startIcon={busy ? <CircularProgress size={18} /> : <CloudUploadIcon />}
              >
                Upload
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Upload;