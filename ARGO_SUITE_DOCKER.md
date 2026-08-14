# Argo Suite — single-image deployment

This packages the whole app — frontend, backend API, and PostgreSQL — into **one Docker
image**. No `docker-compose`, no separate containers: `docker run` and it's up.

Internally it's still your existing app (unchanged code). `supervisord` runs three
processes inside the one container:

- **postgres** — the database, initialized on first boot
- **backend** — the Node/Express API (port 5000, internal only)
- **nginx** — serves the built frontend on port 80 and reverse-proxies `/api/` to the
  backend

## 1. Add these files to your repo

Copy this structure into the **root** of your `Tickette` repo (alongside the existing
`backend/`, `frontend/`, `docker-compose.yml`):

```
Tickette/
├── Dockerfile              ← new, root-level, all-in-one build
├── .dockerignore           ← new
└── docker/
    ├── entrypoint.sh       ← new
    ├── nginx.conf          ← new
    └── supervisord.conf    ← new
```

Your existing `backend/Dockerfile`, `docker-compose.yml`, etc. are untouched — this is an
additional, self-contained option.

## 2. Build the image

From the repo root:

```bash
docker build -t argo-suite:latest .
```

## 3. Run it

```bash
docker run -d \
  --name argo-suite \
  -p 8080:80 \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e DB_PASSWORD="a-strong-password-here" \
  -v argo_suite_data:/var/lib/postgresql/data \
  argo-suite:latest
```

Then open **http://localhost:8080**.

- `-p 8080:80` — maps container port 80 (nginx) to host port 8080. Change `8080` to
  whatever port you like.
- `-v argo_suite_data:/var/lib/postgresql/data` — persists the database across container
  restarts/recreations. Omit it if you're fine with the data resetting each time you
  recreate the container (stopping/starting the *same* container is fine either way).
- `-e JWT_SECRET=...` / `-e DB_PASSWORD=...` — override the insecure defaults baked into
  the image. Do this for anything beyond local testing.

On first boot the container initializes Postgres, creates the app database, and seeds it
with demo data automatically. First boot takes a few seconds longer than restarts.

## 4. Demo accounts (seeded automatically)

| Role     | Email                  | Password     |
|----------|-------------------------|--------------|
| Admin    | admin@tickette.com      | Admin@123    |
| IT Desk  | itdesk@tickette.com     | ItDesk@123   |
| IT Desk  | itdesk2@tickette.com    | ItDesk@123   |
| User     | user@tickette.com       | User@123     |
| User     | sofia@tickette.com      | User@123     |

## Notes / caveats

- **Image (proof-of-resolution) uploads use AWS S3** (`multer-s3` in
  `backend/src/middleware/upload.js`). Without `S3_BUCKET`, `AWS_REGION`, and valid AWS
  credentials passed in as env vars (or an attached IAM role), the rest of the app works
  fine but attaching a photo to a comment will fail. Pass them in if you need that
  feature:
  ```bash
  -e S3_BUCKET=your-bucket \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=...
  ```
- **This is one container, one process tree** — fine for local use, demos, or a single
  small VM. It intentionally trades away the usual "separate DB/scaling/backup" benefits
  of running Postgres as its own service. For a real production deployment, prefer the
  existing `docker-compose.yml` (or a managed Postgres) over this all-in-one image.
- To reset everything (wipe the database and reseed from scratch):
  ```bash
  docker rm -f argo-suite
  docker volume rm argo_suite_data
  # then re-run the `docker run` command above
  ```
- Logs for each internal process are viewable with `docker logs argo-suite` (supervisord
  forwards nothing by default beyond its own log — for finer-grained logs, `docker exec
  -it argo-suite sh` and look in `/var/log/supervisor/`).