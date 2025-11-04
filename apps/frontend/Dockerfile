FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.6.0 --activate

FROM base AS deps

RUN apk add --no-cache libc6-compat

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/frontend/package.json ./apps/frontend/

ENV NODE_ENV=development
RUN yarn install

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY .yarn ./.yarn
COPY apps/frontend ./apps/frontend

ARG NEXT_PUBLIC_CORE_ADDRESS
ARG NEXT_PUBLIC_MATCHMAKING_ADDRESS
ARG NEXT_PUBLIC_AUTH_ADDRESS

ENV NEXT_PUBLIC_CORE_ADDRESS=${NEXT_PUBLIC_CORE_ADDRESS}
ENV NEXT_PUBLIC_MATCHMAKING_ADDRESS=${NEXT_PUBLIC_MATCHMAKING_ADDRESS}
ENV NEXT_PUBLIC_AUTH_ADDRESS=${NEXT_PUBLIC_AUTH_ADDRESS}

WORKDIR /app/apps/frontend

RUN yarn build

FROM base AS runner

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/frontend/server.js"]
