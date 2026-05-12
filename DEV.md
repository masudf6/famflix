# Local Development with Docker Compose

This stack is for **local development only**, separate from the k3s/EC2 production
deployment. Edits on your host trigger live reload inside the containers.

## What you get

| Service  | URL                       | Live reload                    |
|----------|---------------------------|--------------------------------|
| Frontend | http://localhost:5173     | Vite HMR via bind mount        |
| Backend  | http://localhost:8000     | `uvicorn --reload` via bind mount |
| Postgres | localhost:5432            | data persisted in named volume |

## One-time setup

1. Create the backend env file:
   ```bash
   cp backend/.env.example backend/.env
   # then edit backend/.env and fill in JWT_SECRET_KEY and AWS_* values
   ```

   The `.env` you already use in production works too — `docker-compose.dev.yml`
   overrides only `DATABASE_URL` so the backend talks to the `db` service.

## Run it

```bash
docker compose -f docker-compose.dev.yml up --build
```

Subsequent runs (no Dockerfile changes):

```bash
docker compose -f docker-compose.dev.yml up
```

Stop and clean up:

```bash
docker compose -f docker-compose.dev.yml down          # keep db data
docker compose -f docker-compose.dev.yml down -v       # wipe db data too
```

## How live reload works

- **Backend** — `./backend/app` is bind-mounted into the container at `/app/app`.
  Uvicorn runs with `--reload --reload-dir /app/app` and `WATCHFILES_FORCE_POLLING=true`,
  so saving any `.py` file restarts the server in ~1s.
- **Frontend** — `./frontend` is bind-mounted at `/app`. Vite's dev server runs
  with HMR; `CHOKIDAR_USEPOLLING=true` makes file events reliable on Docker
  Desktop bind mounts. `node_modules` lives in an anonymous volume inside the
  container so your host's `node_modules` (if any) doesn't shadow it.

## API routing locally

In production an ingress strips the `/api` prefix before forwarding to the
backend. There's no ingress here, so `VITE_API_BASE_URL` is set to
`http://localhost:8000` in compose — the browser hits the backend directly.
The backend's CORS allowlist already includes `http://localhost:5173`, so no
source changes are needed.

If you'd rather keep the `/api` prefix locally too, add a Vite proxy to
`frontend/vite.config.ts`:

```ts
server: {
  host: "::",
  port: 8080,
  proxy: {
    "/api": {
      target: "http://backend:8000",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
}
```

…and remove `VITE_API_BASE_URL` from `docker-compose.dev.yml`.

## Common gotchas

- **First boot is slow** — `npm install` runs once during image build (~1–2 min).
- **HMR not picking up changes** — confirm the polling env vars are set; on
  Linux hosts you can usually unset them for faster, native inotify-based
  watching.
- **Port already in use** — change the host-side port mapping in compose
  (e.g. `"5174:5173"`).
- **Backend boot crash about missing AWS_*** — `app/core/config.py` requires
  all AWS settings to be present. Any non-empty placeholder values let the
  app boot if you don't need S3 features locally.

## Files added

```
backend/Dockerfile.dev          # dev image, uvicorn --reload
backend/.env.example            # template
frontend/Dockerfile.dev         # dev image, vite dev server
docker-compose.dev.yml          # the dev stack
DEV.md                          # this file
```

The original `docker-compose.yml` and Dockerfiles are untouched, so the
production build pipeline continues to work as before.
