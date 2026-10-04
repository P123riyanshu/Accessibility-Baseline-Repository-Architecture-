# Accessible public-service platform

A TypeScript monorepo foundation for an accessible public-service web
application. The client includes a responsive CivicDesk operations dashboard
with searchable service requests, request details and creation dialogs, reports,
and workspace settings. Dashboard records are illustrative local data; the
server currently exposes a health check to verify the client connection.

## Architecture

```text
client/                 React + Vite user interface
server/                 Express HTTP boundary and domain logic
docs/                   Architecture and accessibility audit
tests/                  Cross-boundary and integration tests
screenshots/             Audit evidence captured from California DMV
```

- **Client:** owns presentation, keyboard interaction, accessible form states,
  and HTTP calls. It does not own business rules or persistence.
- **Server:** owns API contracts, input validation, domain rules, and
  persistence adapters. The client reaches it through `/api`.
- **Docs:** records decisions, setup, and the external-site audit separately
  from application behavior.
- **Tests:** keeps API and end-to-end coverage at the boundaries where user
  workflows cross packages.

The server exposes `GET /api/health`. The dashboard displays the API connection
state to verify local setup and the Vite proxy.

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

## First product vertical slice

Implement a **service directory search** from UI through persistence:

1. Add an explicitly labelled search form with loading, result, empty, and error
   states in the client. Support submit by keyboard and keep focus predictable.
2. Add `GET /api/services?q=...`; validate and normalize the query at the
   server boundary.
3. Put search behavior in a server domain/service module and read records
   through a repository interface (start with an in-memory adapter).
4. Return a stable response contract and render result links with meaningful
   names, not repeated “Learn more” labels.
5. Cover query validation and repository behavior with unit tests, the route
   with an integration test, and the full search workflow with keyboard tests.

Keep the HTTP contract independent of React and the repository implementation
independent of Express so either can evolve without changing the other.

## Audit evidence

The California DMV portal audit, five prioritized findings, and captured
screenshots are documented in [the accessibility audit](./docs/accessibility-audit.md).
The CSV is available at [docs/accessibility-audit.csv](./docs/accessibility-audit.csv).
