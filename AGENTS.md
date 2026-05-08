# AGENTS.md

Compact reference for AI agents working in this repo.

## Repo layout

- **`client/`** – the entire application. All package commands run from here.
- **Root** – only Docker orchestration (`docker-compose.yml`, `.env`, `.env.example`).
- No monorepo, no workspaces, no CI workflows, no test suite.

## Tech stack

- Astro 5 with `@astrojs/node` adapter (`output: "server"`, `mode: "standalone"`).
- TailwindCSS v4 via `@tailwindcss/vite` (not PostCSS).
- DaisyUI 5.
- LibSQL (SQLite) via `@libsql/client` — file-based DB at `client/data/local.db`.
- JWT cookie auth (no external identity provider).

## Required setup

1. `cd client`
2. `npm install`
3. `npm run setup:data` — copies `data/intialData.example.ts` → `data/intialData.ts`.
   - **Spelling matters:** the filename is `intialData` (missing second `i`) in both the script and the gitignore.
   - This file is required; `predev` and `prebuild` run the copy automatically, but if it’s missing the build will fail.

## Environment variables

Used at runtime (Docker or local). All have defaults, so local dev works without a `.env`.

| Var | Default | Note |
|-----|---------|------|
| `ADMIN_PASSWORD` | `admin` | Login password |
| `JWT_SECRET` | `your_jwt_secret_here` | Token signing secret |
| `SECURE_COOKIES` | `false` | Set `true` for HTTPS |
| `PORT` | `4321` | App port |
| `NODE_ENV` | `production` | Docker default |

For local dev, create `client/.env` if you need to override. For Docker, use the root `.env` file.

## Commands

All from `client/`:

| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on `0.0.0.0:4321` (`--host`) |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint for `.ts`, `.tsx`, `.astro` |
| `npm run astro -- --help` | Astro CLI help |

There is **no test command** and no test runner configured.

## Database behavior

`src/lib/database.ts` auto-creates tables on first import if they don’t exist:
- `groups`, `students`, `comments`
- Then calls `setInitialData()` from `data/intialData.ts` to seed.

The DB file (`data/local.db`) and seed file (`data/intialData.ts`) are gitignored. Treat them as private/local state.

## Auth / routing

- `src/middleware.ts` checks `auth_token` cookie on every request.
- Protected routes redirect to `/login` if unauthenticated.
- Unprotected routes: `/`, `/login`, `/api/login`.
- Token logic in `src/lib/token.ts`, password check in `src/pages/api/login.ts`.

## TypeScript paths

`tsconfig.json` maps `@/*` → `src/*`. This is used throughout the codebase.

## Docker notes

- `docker-compose.yml` is at repo root; `Dockerfile` is inside `client/`.
- Build context is `./client`.
- The compose file mounts `./client/data:/app/data` so the DB persists across container restarts.
- Dockerfile uses `node:20-alpine` and runs `node ./dist/server/entry.mjs`.

## Lint / format

- ESLint config: `client/eslint.config.js` — uses `typescript-eslint` + `eslint-plugin-astro`.
- Prettier config: `client/.prettierrc` — includes `prettier-plugin-astro`.

## Conventions

- UI text is in Spanish (e.g. "Estudiantes", "Iniciar Sesión"). Keep new UI copy in Spanish.
- No generated code other than Astro’s `.astro/` types.
- No API contracts or OpenAPI specs; API routes are ad-hoc in `src/pages/api/`.
