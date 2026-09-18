# Server

From `server/`, fill in `.env` using `.env.example`, then:

```sh
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

In another terminal: `bun run worker:dev`.

Checks: `bun run typecheck` and `bun run lint`. Install shared lint tools with `bun install` at the project root first.

The API runs on port 8000. Files use S3; jobs use Upstash Redis.
Use the Supabase session-pooler URL (port 5432) for `DATABASE_URL`; the app and migrations share it.
Append `?sslmode=require&uselibpqcompat=true` for encrypted TLS without certificate verification.
Set `OPENAI_EMBEDDING_DIMENSIONS` to match your Pinecone index.
Behind HTTPS, the private reverse proxy must overwrite `X-Forwarded-Proto`; cookies follow the request protocol.
