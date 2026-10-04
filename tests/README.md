# Test boundaries

- `server/app.test.ts` exercises the public HTTP health contract using an
  in-process Express app.
- Client tests belong beside client components and should cover accessible
  names, status announcements, keyboard behavior, and error/empty states.
- The first end-to-end suite should verify service search from keyboard
  submission through API response and rendered results.

Run all workspace tests from the repository root with `npm test`.
