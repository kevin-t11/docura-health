FROM oven/bun:1.3.0
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json server/bun.lock ./
RUN bun install --frozen-lockfile
COPY server/ ./
COPY shared/ /app/shared/
RUN bun run db:generate
ENV NODE_ENV=production
USER bun
EXPOSE 8000
CMD ["bun", "run", "start"]
