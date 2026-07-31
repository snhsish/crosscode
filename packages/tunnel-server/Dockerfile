FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PNPM_HOME=/usr/local/bin
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tunnel-server/package.json ./packages/tunnel-server/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @crosscode/tunnel-server build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100

COPY --from=builder /app/packages/tunnel-server/dist ./dist

RUN echo '{"name":"tunnel-server","type":"module","dependencies":{"postgres":"^3.4.5","ws":"^8.18.0"}}' > package.json && \
    npm install --omit=dev

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3100/health || exit 1

CMD ["node", "dist/index.js"]
