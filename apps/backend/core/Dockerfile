FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

FROM base AS deps

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/common/package.json ./apps/backend/common/
COPY apps/backend/core/package.json ./apps/backend/core/

ENV NODE_ENV=development
RUN yarn install

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn ./.yarn
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/common ./apps/backend/common
COPY apps/backend/core ./apps/backend/core

WORKDIR /app/apps/backend/common
RUN /app/node_modules/.bin/tsc

WORKDIR /app/apps/backend/core
RUN /app/node_modules/.bin/tsc

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 coreuser

COPY --from=deps /app/node_modules ./node_modules

COPY --from=builder /app/apps/backend/common/dist ./apps/backend/common/dist
COPY --from=builder /app/apps/backend/common/package.json ./apps/backend/common/
COPY --from=builder /app/apps/backend/core/dist ./apps/backend/core/dist
COPY --from=builder /app/apps/backend/core/package.json ./apps/backend/core/

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

USER coreuser

EXPOSE 8080

WORKDIR /app/apps/backend/core

CMD ["node", "dist/server.js"]
