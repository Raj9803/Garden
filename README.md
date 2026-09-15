# The Field

A procedurally generated 3D sunflower field where visitors can plant a flower and leave a short note for whoever finds it next.

**Live demo:** https://garden-582.pages.dev

## How it works

The field is infinite and generated on the fly: as the camera moves, the app derives which "chunk" of world space it's over and procedurally places flowers within it using a deterministic hash (same chunk always generates the same flower layout, no storage needed for the terrain itself). Clicking an empty flower lets you write a note; clicking one that already has a note lets you read it. Only the notes are persisted — the flower positions are recomputed from the hash every time.

## Architecture

- **Frontend** — Next.js, statically exported (`next build` with `output: "export"`) and served from Cloudflare Pages. 3D rendering via `three.js` / `@react-three/fiber` / `@react-three/drei`, state via `zustand`.
- **API** — A standalone Cloudflare Worker ([`worker/src/index.ts`](worker/src/index.ts)) exposing two endpoints:
  - `GET /chunk?x=&z=` — returns any notes planted within a given chunk
  - `POST /note` — creates or updates a note for a flower
- **Storage** — Cloudflare D1 (SQLite), schema in [`schema.sql`](schema.sql).

The frontend and API are deployed and scaled independently — the frontend is a static site with no server, and the Worker only does something when a note is read or written.

## Local development

```bash
npm install

# apply the D1 schema locally
npm run db:migrate

# run the API worker (http://127.0.0.1:8787)
npx wrangler dev

# run the frontend (http://localhost:3000)
npm run dev
```

The frontend talks to the API via `NEXT_PUBLIC_API_URL` (see [`.env.example`](.env.example)), defaulting to `http://127.0.0.1:8787` for local dev.

## Deploying

- **Worker**: fill in `account_id` and `database_id` in [`wrangler.toml`](wrangler.toml) for your own Cloudflare account, then `npx wrangler deploy`.
- **Frontend**: connect the repo to Cloudflare Pages (build command `npm run build`, output directory `out`), and set `NEXT_PUBLIC_API_URL` to your deployed Worker's URL.
