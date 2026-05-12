# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate
WORKDIR /repo

# ── deps ───────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @travelocount/web... --filter @travelocount/shared

# ── build ──────────────────────────────────────────────────────
FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
COPY apps/web apps/web
COPY packages/shared packages/shared
# Avoid Next collecting .env at build time (we inject runtime env via compose)
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV GOOGLE_CLIENT_ID=build-placeholder
ENV GOOGLE_CLIENT_SECRET=build-placeholder
RUN pnpm --filter @travelocount/web build

# ── runner ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/apps/web/.next ./apps/web/.next
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public
COPY --from=build --chown=app:app /repo/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=app:app /repo/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build --chown=app:app /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=build --chown=app:app /repo/node_modules ./node_modules
COPY --from=build --chown=app:app /repo/packages/shared ./packages/shared
COPY --from=build --chown=app:app /repo/package.json ./package.json
USER app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
