
// ---------------------------------------------------------------------------
// SERVICE GATE: the executor is NOT registered yet. Fill in the real address
// at launch. While this is empty, the enrollment widget reports "not live".
//
// FILL-IN-AT-LAUNCH CHECKLIST (status as of 2026-08-15, soft launch):
//   1. DONE 2026-08-15 — PUBLIC_EXECUTOR set, visible placeholders replaced,
//      explorer links (registration tx + address page) filled in. All values
//      chain-verified: executor is #18 in getRegisteredExecutors, fee 0.1,
//      registration tx status 1.
//   2. PARTLY DONE 2026-08-15 — executor-count/fee census re-read from the
//      chain and re-dated (18 executors, 9 at 0.1, median 0.15). STILL TO DO
//      at public announce: re-verify the ~90-day claim window from the chain
//      (WEBSITE-COPY.md requirement).
//   3. DONE 2026-08-15 — portal-listing question resolved (verified from the
//      portal's production frontend bundle): the portal names NO executor;
//      its Set Executor field is free-text address entry, and on pasting a
//      registered executor's address the portal itself reads
//      ClaimSetupManager live and confirms "registered executor" + the fee.
//      Row rewritten as a third independent verification path.
//   4. Deploy workers/notify-signup with a KV or webhook binding.
//   5. ANNOUNCE GATE: the server-side tamper watchdog (built separately) must
//      be live — it polls this page and alarms if the displayed executor
//      address ever differs from the expected constant.
//   6. AT PUBLIC ANNOUNCE ONLY (deliberately kept during soft launch):
//      remove ALL soft-launch markers (FA-26; reworded per FA-29
//      2026-08-16 -- "not live" phrasing contradicted the live
//      enrollment and is gone): the meta description's "soft launch"
//      text, the hero "Soft launch — not announced yet" pill, the
//      soft-launch banner in the body, the h2 "soft launch" pill, and
//      the sign-up form's "Sign-ups open at the public announcement"
//      line. Grep this file for "soft launch", "not announced",
//      "announcement" to be sure none survive.
// ---------------------------------------------------------------------------
const PUBLIC_EXECUTOR = "0x4b7905d5CBd4f2Ee02Aff3c20bBf728Ec69E33d4"; // registered 2026-08-15, chain-verified

const RPC = "https://flare-api.flare.network/ext/bc/C/rpc";
const CLAIM_SETUP_MANAGER = "0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB";
// keccak256("isClaimExecutor(address,address)")[0:4], verified against the
// live contract 2026-08-15 (valid calldata returns a bool word).
const SELECTOR_IS_CLAIM_EXECUTOR = "0x87962abe";

const isAddress = (s) => /^0x[0-9a-fA-F]{40}$/.test(s);
const pad32 = (addr) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

function show(el, cls, msg) {
  el.className = "result show result--" + cls;
  el.textContent = msg;
}

// --- Check-my-enrollment widget (client-side only, no backend) ---
(function () {
  const btn = document.getElementById("check-btn");
  const input = document.getElementById("check-addr");
  const out = document.getElementById("check-result");

  async function check() {
    const owner = input.value.trim();
    if (!isAddress(owner)) {
      show(out, "err", "That doesn't look like a wallet address — expected 0x followed by 40 hex characters.");
      return;
    }
    if (!PUBLIC_EXECUTOR) {
      show(out, "wait", "The CashLab executor service is not yet live — there is no executor address to be enrolled with. Check back after launch.");
      return;
    }
    show(out, "wait", "Checking on-chain…");
    try {
      const data = SELECTOR_IS_CLAIM_EXECUTOR + pad32(owner) + pad32(PUBLIC_EXECUTOR);
      const r = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call",
          params: [{ to: CLAIM_SETUP_MANAGER, data }, "latest"] })
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      const enrolled = BigInt(j.result) === 1n;
      if (enrolled) {
        show(out, "ok", "Enrolled: the CashLab executor is authorized for this wallet (read live from ClaimSetupManager).");
      } else {
        show(out, "wait", "Not enrolled: the CashLab executor is not authorized for this wallet (read live from ClaimSetupManager).");
      }
    } catch (e) {
      show(out, "err", "Could not reach the Flare public RPC to check. Nothing is wrong with your enrollment — please try again in a moment, or verify directly at portal.flare.network.");
    }
  }

  btn.addEventListener("click", check);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); check(); } });
})();

// --- Email opt-in form (POSTs to a placeholder endpoint; worker is staged,
//     not deployed — see workers/notify-signup/) ---
(function () {
  const form = document.getElementById("notify-form");
  const out = document.getElementById("notify-result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const wallet = document.getElementById("nf-wallet").value.trim();
    const email = document.getElementById("nf-email").value.trim();
    if (!isAddress(wallet)) {
      show(out, "err", "Please enter a valid wallet address (0x followed by 40 hex characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      show(out, "err", "Please enter a valid email address.");
      return;
    }
    show(out, "wait", "Submitting…");
    try {
      const r = await fetch("/api/notify-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, email })
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      show(out, "ok", "Signed up. We'll email you claim outcomes and stake-expiry reminders — nothing else. Remove yourself any time via hello@cashlab.network.");
    } catch (err) {
      show(out, "err", "Could not submit — the sign-up service is not yet live. Nothing was stored. Please check back after launch.");
    }
  });
})();
