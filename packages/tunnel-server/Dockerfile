FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PNPM_HOME=/usr/local/bin
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tunnel-server/package.json ./packages/tunnel-server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/tunnel-server/node_modules ./packages/tunnel-server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

RUN pnpm --filter @crosscode/tunnel-server build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

COPY --from=builder /app/packages/tunnel-server/dist ./dist

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3100/health || exit 1

CMD ["node", "dist/index.js"]
