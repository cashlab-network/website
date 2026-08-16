/**
 * CashLab notify-signup worker — STAGED, NOT DEPLOYED.
 *
 * Backs the email opt-in form on /autoclaim.html (POST /api/notify-signup).
 * Stores voluntary wallet -> email pairs used ONLY for claim-outcome
 * notifications and stake-expiry reminders (see /privacy). No marketing.
 * Entries are PII: delete on request (hello@cashlab.network).
 *
 * Bindings (configure at deploy time — no secrets in this repo):
 *   NOTIFY_KV       (KV namespace, optional) — primary store
 *   NOTIFY_WEBHOOK  (secret/env var, optional) — fallback: POST each signup
 *                    as JSON to this URL if KV is not bound
 *
 * Deploy (when green-lit, NOT now):
 *   wrangler deploy --route cashlab.network/api/notify-signup
 */

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
// Deliberately simple: one @, no whitespace, a dot in the domain. The
// confirmation email is the real validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/notify-signup") {
      return json(404, { ok: false, error: "not found" });
    }
    if (request.method !== "POST") {
      return json(405, { ok: false, error: "POST only" });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(400, { ok: false, error: "invalid JSON" });
    }

    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!ADDRESS_RE.test(wallet)) {
      return json(400, { ok: false, error: "invalid wallet address" });
    }
    if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL_LEN) {
      return json(400, { ok: false, error: "invalid email address" });
    }

    const record = {
      wallet: wallet.toLowerCase(),
      email,
      ts: new Date().toISOString(),
    };

    if (env.NOTIFY_KV) {
      // One record per wallet; a re-submission updates the email.
      await env.NOTIFY_KV.put(
        "signup:" + record.wallet,
        JSON.stringify(record)
      );
      return json(200, { ok: true });
    }

    if (env.NOTIFY_WEBHOOK) {
      const r = await fetch(env.NOTIFY_WEBHOOK, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!r.ok) {
        return json(502, { ok: false, error: "storage unavailable" });
      }
      return json(200, { ok: true });
    }

    // Neither binding configured: refuse rather than silently drop.
    return json(503, { ok: false, error: "signup not open yet" });
  },
};
