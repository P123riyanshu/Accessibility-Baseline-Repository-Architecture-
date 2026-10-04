# CivicDesk — public-service operations capstone

A responsive, accessible SaaS-style workspace for managing public service
requests. CivicDesk demonstrates a sign-in flow, editable resident request
records, live team tasks, browser-persisted preferences, reports, and a
mobile-friendly operations dashboard.

## Architecture

```mermaid
flowchart LR
  U[User] --> C[React + TypeScript client]
  C --> LS[(Browser localStorage)]
  C --> API[JSONPlaceholder REST API]
  C --> H[/api/health]
  H --> NF[Netlify Function]
  C -. local development .-> E[Express health endpoint]
```

- **Client (`client/src/`):** React/TypeScript UI, async API client, responsive
  styles, accessible forms, request CRUD, search/filtering, and sort controls.
- **Demo data:** requests, the signed-in demo profile, and task-board
  preferences are stored in this browser's `localStorage`. Request changes are
  isolated to the current browser and are not shared with other users.
- **External API:** the team task board reads sample todos and assignees from
  JSONPlaceholder. It includes loading, error, and retry states.
- **Health check:** local development uses the Express server; Netlify uses the
  small function in `netlify/functions/`.
- **Tests and audit:** `tests/` contains server API tests; `docs/` and
  `screenshots/` contain accessibility audit material.

The sign-in is intentionally simulated for a portfolio demo. It does not
authenticate identities, protect private data, or replace a production identity
provider. Do not enter real resident information; browser storage is not a
production database.

## Features

- Demo sign-in and sign-out with a locally persisted profile.
- Create, view, edit, update status, and delete service requests.
- Search requests and filter by status; request changes survive reloads in the
  same browser.
- Load team tasks asynchronously; search by title or assignee, filter by
  completion, and sort by title, assignee, or status.
- Persist task-board preferences and show actionable storage/API errors.
- Responsive layouts, keyboard-accessible dialogs, focus indicators, reduced
  motion support, and light/dark color schemes.

## Responsive design

The dashboard stylesheet is `client/src/style.css`. Its `:root` tokens define
the brand palette, type scale, spacing, radii, surfaces, and shadows. Layout
rules are mobile-first, with breakpoints at 320px, 768px, 1024px, and 1440px.
The request table keeps its minimum readable width inside its own horizontal
scroll region so it does not expand the page on narrow screens.

Light and dark palettes follow `prefers-color-scheme`; set
`data-theme="light"` or `data-theme="dark"` on `<html>` to explicitly choose a
theme. Browser-rendered responsive previews:

- [320px](./screenshots/civicdesk-responsive-320.png)
- [768px](./screenshots/civicdesk-responsive-768.png)
- [1024px](./screenshots/civicdesk-responsive-1024.png)
- [1440px](./screenshots/civicdesk-responsive-1440.png)
- [Dark theme at 1024px](./screenshots/civicdesk-responsive-dark-1024.png)

## Local setup

Requires Node.js 20 or newer and npm.

```powershell
npm install
```

Run each command in a separate terminal:

```powershell
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. The client proxies `/api` requests to the server
at `http://localhost:3000`. Verify the API directly at
`http://localhost:3000/api/health`.

Run the workspace checks:

```powershell
npm test
npm run build
```

The client and server each have their own workspace scripts. The root scripts
run them across the workspace.

## Deploy to Netlify

The repository includes [`netlify.toml`](./netlify.toml) for a static Vite
build, a health-check function, and a single-page-app fallback.

Netlify runs `npm run build --workspace @service/client` on Node.js 20 and
publishes `client/dist`. Deploying the frontend does not turn the simulated
sign-in or browser-only request storage into shared production services.

- Source repository: [P123riyanshu/Accessibility-Baseline-Repository-Architecture-](https://github.com/P123riyanshu/Accessibility-Baseline-Repository-Architecture-)
- Live deployment: [CivicDesk on Netlify](https://enchanting-palmier-8f4985.netlify.app/)
- Health check: [Production API status](https://enchanting-palmier-8f4985.netlify.app/api/health)

## Repository layout

```text
client/                 React + Vite user interface
server/                 Express health-check API for local development
netlify/functions/      Netlify health-check function
docs/                   Accessibility audit
tests/                  Server API integration tests
screenshots/             Responsive and accessibility audit evidence
```

## Audit evidence

The California DMV portal audit, five prioritized findings, and captured
screenshots are documented in [the accessibility audit](./docs/accessibility-audit.md).
The CSV is available at [docs/accessibility-audit.csv](./docs/accessibility-audit.csv).
