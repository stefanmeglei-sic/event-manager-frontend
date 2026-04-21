# ── Dependencies stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Builder stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time env: point to backend via internal docker network
ARG NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
