# Client

React owns user-facing presentation and accessible interaction. The service
request board supports create, read, update, delete, search, and status filters.
Its sample records and demo profile are persisted in browser `localStorage`;
this is a single-browser demo, not shared server persistence or real
authentication.

The Team tasks view fetches demonstration tasks and assignees from
JSONPlaceholder through the typed client module `src/api.ts`. Its search,
status category, and sort preferences are stored in browser `localStorage`;
the source is read-only. The app includes loading, retry, storage-error, and
empty states.

The root [`netlify.toml`](../../netlify.toml) configures the static deployment
and health-check function. See the root README for local development and
deployment setup.
