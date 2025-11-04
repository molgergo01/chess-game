FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/common/package.json ./apps/backend/common/
COPY apps/backend/matchmaking/package.json ./apps/backend/matchmaking/

ENV NODE_ENV=development
RUN yarn install

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn ./.yarn
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/common ./apps/backend/common
COPY apps/backend/matchmaking ./apps/backend/matchmaking

WORKDIR /app/apps/backend/common
RUN /app/node_modules/.bin/tsc

WORKDIR /app/apps/backend/matchmaking
RUN /app/node_modules/.bin/tsc

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 matchmakinguser

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/apps/backend/common/dist ./apps/backend/common/dist
COPY --from=builder /app/apps/backend/common/package.json ./apps/backend/common/
COPY --from=builder /app/apps/backend/matchmaking/dist ./apps/backend/matchmaking/dist
COPY --from=builder /app/apps/backend/matchmaking/package.json ./apps/backend/matchmaking/

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

USER matchmakinguser

EXPOSE 8081

WORKDIR /app/apps/backend/matchmaking

CMD ["node", "dist/server.js"]
