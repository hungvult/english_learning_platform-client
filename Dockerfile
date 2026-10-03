# ── Base image with required system libraries ─────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Required for Alpine libc compatibility with SWC / native modules
RUN apk add --no-cache libc6-compat

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies stage ────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ── Development stage (hot-reload with Turbopack) ─────────────────────────────
FROM base AS development

ENV NODE_ENV=development

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

RUN mkdir -p /app/.next && chown -R node:node /app/.next

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ── Builder stage (for production build) ──────────────────────────────────────
FROM base AS builder

ENV NODE_ENV=production

# Public build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,target=/app/.next/cache npm run build

# ── Production runner stage (standalone) ──────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 -G nodejs nextjs

# Copy built application assets with non-root ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Node directly handles PID 1 signals cleanly
CMD ["node", "server.js"]
