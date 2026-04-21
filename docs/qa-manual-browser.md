# Manual Browser QA Checklist

Use this checklist for every release candidate. Mark each item as pass/fail and record evidence (screenshots, request IDs, or logs) for failures.

## Preconditions

- Start backend (`http://localhost:4000`) and frontend (`http://localhost:5173`) or use Docker (`http://localhost:8080`).
- Seed user exists: `admin@example.com` / `changeme`.
- Browser devtools network panel is open to inspect status codes and failed requests.
- Test files prepared:
  - `valid.pdf` (small PDF under 1 MB)
  - `invalid.exe` (unsupported extension)
  - `oversize.pdf` (greater than 10 MB)

## Authentication tests

- [ ] Open app and verify login screen renders with email/password fields and submit button.
- [ ] Login with valid credentials (`admin@example.com` / `changeme`) and confirm directory page loads.
- [ ] Logout and confirm app returns to login screen.
- [ ] Try fake account (`nobody@example.com` / `bad-pass`) and verify login is rejected with user-facing error.
- [ ] Try malformed email (`not-an-email`) and verify login is rejected.
- [ ] Submit empty password and verify login is rejected.

Expected:
- Failed logins must not navigate to directory view.
- No successful session cookie should be established after failed login attempts.

## Client CRUD tests

- [ ] Click **Add client** and create a client with valid values in all required fields.
- [ ] Confirm new client appears in table after save.
- [ ] Open edit flow for that client, change email/phone, save, and confirm values are updated.
- [ ] Confirm tax identifier cannot be edited in edit mode.
- [ ] Delete the client and confirm it disappears from the table.

Expected:
- Every create/edit/delete action reflects in UI after refresh.
- No console errors for successful operations.

## Document upload and metadata tests

- [ ] Create or edit a client and add one document row with `valid.pdf`, expiration date, and optional note, then save.
- [ ] Confirm uploaded document appears as downloadable link with size.
- [ ] Edit document metadata (expiration date/notes) and save; confirm updated values persist.
- [ ] Remove document row for stored document and save; confirm document disappears.

Expected:
- Valid uploads return success and render in list.
- Download link should return file response.

## Negative upload tests

- [ ] Try upload with unsupported extension (`invalid.exe`) and verify save fails with clear error.
- [ ] Try upload file above 10 MB (`oversize.pdf`) and verify save fails.
- [ ] Add file without expiration date and verify client-side validation blocks submission.
- [ ] Add expiration date/notes without selecting a file in a new row and verify client-side validation blocks submission.
- [ ] Add empty document rows and verify save still works when rows are truly empty.

Expected:
- Unsupported type should fail with validation error (400 class behavior).
- Oversized file should fail with payload-too-large behavior (413 class behavior).
- Browser must not silently swallow failed uploads.

## Session and resilience tests

- [ ] While logged in, remove session cookie manually in devtools and attempt refresh/list action.
- [ ] Verify app handles unauthorized state by returning to login flow.
- [ ] Open browser console during all major actions and verify no uncaught exceptions.
- [ ] Refresh page during active session and confirm authenticated state restores correctly.

## Final smoke checks

- [ ] Open Swagger docs at `/api/docs/` and confirm page loads.
- [ ] Check API health endpoint `/api/health` returns `status: ok`.
- [ ] Run through one complete happy path: login -> create client -> upload valid doc -> logout.

## Exit criteria

- All checklist items pass.
- Any failed item has issue filed with reproduction steps and environment details.
