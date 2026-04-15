FROM node:20-alpine AS base

WORKDIR /app

# ── Install dependencies ───────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── Development server (hot-reload) ───────────────────────────────────────────
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]
