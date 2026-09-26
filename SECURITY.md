# Security policy

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's
[private vulnerability reporting](https://github.com/FabianoArthur/barbearia-frontend/security/advisories/new)
instead, with steps to reproduce and the impact you expect. You should get a
reply within a week.

## Scope and notes

- This repository is the web client only. Authentication, authorisation and
  data storage are enforced by the separate REST API.
- Sessions use cookies plus a CSRF header (`x-csrf-token`); the client never
  stores tokens in `localStorage`.
- `VITE_*` variables end up in the public JavaScript bundle. Never put a secret
  in them. The reCAPTCHA v3 **site** key is public by design; its secret key
  belongs to the backend.
- The demo build (`VITE_DEMO=true`) contains only invented data.
