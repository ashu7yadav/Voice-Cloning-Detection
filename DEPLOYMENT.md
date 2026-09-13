# 🚀 VOXGUARD AI — Complete Cloud & Local Deployment Guide

VOXGUARD AI can be deployed in multiple ways depending on your target infrastructure:

1. **[Option 1: 1-Click Free Cloud Deployment (Render)](#option-1-render-free-cloud-hosting)** — *Recommended for Quick Live URL*
2. **[Option 2: Docker / Container Deployment](#option-2-docker--docker-compose)** — *Recommended for VPS, AWS EC2, GCP, DigitalOcean*
3. **[Option 3: Railway Deployment](#option-3-railway-deployment)**
4. **[Option 4: Hugging Face Spaces (Docker Space)](#option-4-hugging-face-spaces)**
5. **[Option 5: Split Deployment (Vercel Frontend + Cloud Backend)](#option-5-vercel--cloud-backend)**

---

## Option 1: Render (Free Cloud Hosting)

Render provides free Docker-based web service hosting:

1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** -> **Web Service**.
3. Select your repository: `ashu7yadav/Voice-Cloning-Detection`.
4. Render will automatically detect the `Dockerfile` and `render.yaml`.
5. Configure the service:
   - **Name:** `voxguard-ai`
   - **Environment:** `Docker`
   - **Plan:** `Free` (or Starter)
6. Click **Create Web Service**.
7. In ~3 minutes, Render builds the multi-stage container and provides your live public HTTPS URL (e.g. `https://voxguard-ai.onrender.com`).

---

## Option 2: Docker & Docker Compose

Deploy on any Ubuntu/Debian/CentOS VPS (AWS EC2, DigitalOcean, Linode, Hetzner, etc.):

### 1. Clone Repository & Run Container
```bash
git clone https://github.com/ashu7yadav/Voice-Cloning-Detection.git
cd Voice-Cloning-Detection

# Start with Docker Compose
docker-compose up -d --build
```

### 2. Verify Container Health
```bash
docker ps
curl http://localhost:8001/api/health
```

The application will be live at `http://YOUR_SERVER_IP:8001`.

---

## Option 3: Railway Deployment

1. Go to [railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select `ashu7yadav/Voice-Cloning-Detection`.
4. Railway automatically detects `Dockerfile` / `Procfile`.
5. Under service settings, click **Generate Domain**.
6. Your live instance is immediately accessible on the provided `.up.railway.app` URL.

---

## Option 4: Hugging Face Spaces

1. Create a new Space on [huggingface.co/spaces](https://huggingface.co/spaces).
2. Space SDK: Select **Docker** (Blank).
3. Connect your GitHub repository or push this repository directly to the Hugging Face Space git remote.
4. HF Spaces automatically builds the `Dockerfile` and serves VOXGUARD AI with full GPU/CPU support.

---

## Option 5: Local Production Run

To run the production bundle locally without development servers:

```bash
# 1. Build frontend
cd frontend
npm install
npm run build
cd ..

# 2. Start unified production server
python backend/main.py
```

Open [http://localhost:8001/](http://localhost:8001/) in your browser. Both the React SPA frontend and FastAPI backend endpoints (`/api/*`, `/docs`) run concurrently on the same port.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8001` | Server listening port |
| `HOST` | `0.0.0.0` | Server host binding |
| `DEBUG` | `False` | Enable debug logs and verbose traceback |
| `CORS_ORIGINS` | `*` | Allowed CORS origins list |
| `MAX_AUDIO_DURATION_SEC` | `60.0` | Maximum speech clip length allowed (seconds) |
| `MIN_AUDIO_DURATION_SEC` | `1.0` | Minimum audio length required for analysis (seconds) |
