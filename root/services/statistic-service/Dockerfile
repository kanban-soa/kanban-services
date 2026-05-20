FROM node:20-alpine AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY root/services/statistic-service/package.json ./root/services/statistic-service/package.json

RUN pnpm install --frozen-lockfile --filter ./root/services/statistic-service...

COPY root/services/statistic-service ./root/services/statistic-service

RUN pnpm --filter ./root/services/statistic-service... run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY root/services/statistic-service/package.json ./root/services/statistic-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter ./root/services/statistic-service...

COPY --from=builder /app/root/services/statistic-service ./root/services/statistic-service

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

LABEL authors="miku"

ENTRYPOINT ["pnpm", "run", "dev", "--filter", "./root/services/statistic-service..."]
