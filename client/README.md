# Client

From `client/`:

```sh
bun install
bun run dev
```

Open [localhost:3000](http://localhost:3000) with the API and worker running.
`client/.env` only needs `API_URL` if the API is not at `http://127.0.0.1:8000`.

Checks: `bun run lint` and `bun run build`. Install shared lint tools with `bun install` at the project root first.

UI: Tailwind CSS v4, DM Sans, Hugeicons, beUI, and TanStack Query.
Follow [AGENTS.md](AGENTS.md) when changing components.
