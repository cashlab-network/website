# notify-signup worker — STAGED, NOT DEPLOYED

Backend for the email opt-in form on `/autoclaim.html`
(`POST /api/notify-signup`). Until this is deployed, the form fails
gracefully client-side ("not yet live, nothing was stored").

- Validates an EVM address (`0x` + 40 hex) and a basic email format.
- Stores to a `NOTIFY_KV` KV namespace (key `signup:<wallet-lowercase>`),
  or forwards to a `NOTIFY_WEBHOOK` URL if KV is not bound.
- Refuses (503) if neither binding is configured — never drops silently.
- No secrets in this repo; bindings are set at deploy time.
- Stored pairs are PII: notification-only, no marketing, deleted on
  request via hello@cashlab.network (mirrors `/privacy`).

Do NOT deploy before the operator green-lights the executor service launch.
