# ==============================================================================
# VOXGUARD AI — Production Multi-Stage Container Dockerfile
# Stage 1: Build React 19 Frontend
# Stage 2: Fast lightweight Python 3.11 + PyTorch + FastAPI runtime
# ==============================================================================

# --- Stage 1: Frontend Build ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Backend + Final Runtime ---
FROM python:3.11-slim AS runner

# Install essential system audio & FFmpeg libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code, ML models, and demo samples
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY demo/ ./demo/
COPY tests/ ./tests/

# Copy compiled frontend assets from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create uploads directory and ensure permissions
RUN mkdir -p /app/backend/uploads && chmod 777 /app/backend/uploads

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8001 \
    HOST=0.0.0.0

EXPOSE 8001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8001}/api/health || exit 1

# Start VOXGUARD AI application
CMD ["sh", "-c", "uvicorn backend.main:app --host ${HOST:-0.0.0.0} --port ${PORT:-8001}"]
