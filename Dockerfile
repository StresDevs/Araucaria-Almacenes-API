# ──────────────────────────────────────────────────────────────
# Araucaria Almacenes API — Multi-stage Dockerfile
# NestJS 11 • Node 22 Alpine • ~120 MB final image
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production image ────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled output
COPY --from=build /app/dist ./dist

# Uploads directory (bind mount in production)
RUN mkdir -p uploads/items uploads/evidencias uploads/sectorizacion && \
    chown -R nestjs:nestjs uploads

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]
