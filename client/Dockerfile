FROM node:22-bookworm-slim AS build
COPY --from=oven/bun:1.3.0 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app/client
COPY client/package.json client/bun.lock ./
RUN bun install --frozen-lockfile
COPY client/ ./
COPY shared/ /app/shared/
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_URL=http://api:8000
RUN bun run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build --chown=node:node /app/client/.next/standalone ./
COPY --from=build --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=build --chown=node:node /app/client/public ./client/public
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
