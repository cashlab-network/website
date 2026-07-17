# Deploying CashLab to Cloudflare Pages

This site is a **static, no-build** project. Cloudflare Pages will serve
`index.html` and the `images/` folder directly. No framework, build command, or
Node version needs to be configured.

- **Repo:** `cashlab-network/website` (public)
- **Target domain:** `cashlab.network`
- **Build output directory:** the repository root (this folder). There is no
  compiled `dist/` — the files you see are the files that ship.

There are two ways to deploy: **(A) Git integration** (recommended — auto-deploys
on every push) and **(B) Direct upload via Wrangler CLI** (no Git required).
Pick one.

---

## Prerequisite (one-time): push this folder to the repo

If the code isn't in `cashlab-network/website` yet:

```bash
cd cashlab-website
git init
git add .
git commit -m "Initial CashLab landing site"
git branch -M main
git remote add origin https://github.com/cashlab-network/website.git
git push -u origin main
```

> The `cashlab-network` GitHub org and the `website` repo already exist
> (created 2026-07-16, OAuth restrictions removed so `gh`/git can push directly).

---

## Option A — Git integration (recommended)

Auto-builds and deploys every time you push to `main`.

1. Sign in at **https://dash.cloudflare.com** → in the left sidebar choose
   **Workers & Pages**.
2. Click **Create application** → **Pages** tab → **Connect to Git**.
3. Authorize Cloudflare for the **`cashlab-network`** GitHub organization, then
   select the **`website`** repository.
4. On the **Set up builds and deployments** screen:
   - **Project name:** `cashlab` (this becomes `cashlab.pages.dev`)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *leave blank*
   - **Build output directory:** `/` (the repo root — where `index.html` lives)
5. Click **Save and Deploy**. The first deploy takes ~1 minute. When it finishes,
   your site is live at `https://cashlab.pages.dev`.

From now on, every `git push` to `main` triggers an automatic redeploy. Pushes to
other branches create preview deployments at unique URLs.

---

## Option B — Direct upload via Wrangler CLI (no Git needed)

Useful for a quick one-off deploy or if you'd rather not connect Git.

```bash
# Install the CLI (one-time)
npm install -g wrangler

# Authenticate (opens a browser)
wrangler login

# Create the Pages project (one-time). Production branch = main.
wrangler pages project create cashlab --production-branch main

# Deploy the current folder as the production build
cd cashlab-website
wrangler pages deploy . --project-name cashlab --branch main
```

Re-run the last `wrangler pages deploy .` command whenever you want to push an
update.

---

## Connect the custom domain `cashlab.network`

The domain is **owned via HostGator** (3-year registration, WHOIS privacy). The
cleanest setup is to move DNS to Cloudflare and point the apex domain at the
Pages project.

### Step 1 — Add the site to Cloudflare (moves DNS to Cloudflare)

1. In the Cloudflare dashboard, click **Add a site** and enter `cashlab.network`.
2. Choose the **Free** plan.
3. Cloudflare scans existing DNS records and shows you **two Cloudflare
   nameservers** (e.g. `xxx.ns.cloudflare.com`).

### Step 2 — Point HostGator's nameservers to Cloudflare

1. Log in to HostGator's domain manager.
2. Find `cashlab.network` → **Nameservers** → choose **Custom nameservers**.
3. Replace the existing nameservers with the two Cloudflare nameservers from
   Step 1. Save.
4. Nameserver propagation can take anywhere from a few minutes to ~24 hours.
   Cloudflare emails you when the domain is **Active**.

### Step 3 — Attach the domain to the Pages project

1. Go to **Workers & Pages** → your **`cashlab`** project → **Custom domains**
   tab → **Set up a custom domain**.
2. Enter `cashlab.network` and confirm. Cloudflare automatically creates the
   required DNS record and provisions an SSL certificate.
3. (Recommended) Repeat for `www.cashlab.network` and set a redirect from `www`
   to the apex, or vice-versa, under **Rules → Redirect Rules**.

Once the certificate is issued (usually a few minutes), `https://cashlab.network`
serves the site.

---

## What's already configured for you

- **`_headers`** — sets security headers (nosniff, frame options, referrer policy)
  and caching: images cache for a year (`immutable`), HTML always revalidates so
  content edits go live immediately. Cloudflare Pages reads this file
  automatically.
- **`404.html`** — a branded not-found page Cloudflare Pages serves automatically.
- **`robots.txt` + `sitemap.xml`** — reference `https://cashlab.network/`. If the
  production domain ever changes, update both.
- **SEO / social** — `index.html` includes a meta description and Open Graph /
  Twitter tags. The social preview image is `images/og-image.png` (1200×630) and
  is referenced by absolute URL (`https://cashlab.network/images/og-image.png`).

---

## Post-launch checklist (delegation address)

### CRITICAL: EIP-55 checksum + on-chain visibility requirements (added 2026-07-16 per Perplexity)

**When you publish the delegation address on this landing page, it MUST:**

1. **Be EIP-55 CHECKSUMMED** (mixed case), NOT lowercase.
   - Wrong: `0x69141e890f3a79cd2cff552c0b71508be23712dc`
   - Right: `0x69141E890F3a79cd2CFf552c0B71508bE23712dC`
   - Use `ethers.getAddress()` or `cast wallet address` to produce the checksummed form.
   - **Same checksummed address must be used for the TowoLabs PR** — the `logoURI` filename pattern `0x<address>.png` also requires checksum casing.

2. **Be prominently visible on the landing page** — TowoLabs Extended Requirements (README) enforces "on-chain address referenced on the signal provider's website" since 2023-03-31. Missing this blocks `listed: true` promotion.
   - Currently placed in: Hero section + How-to-delegate section. Both are good.
   - Do NOT hide it behind a hover, dropdown, or 3rd-page link.
   - The `<code class="status-card__addr" id="delegation-address">` block in Hero is the primary visible instance — must contain the actual checksummed address post-launch.



1. Edit `index.html` at the `<!-- REPLACE AT LAUNCH: delegation-address -->` marker
   in the Hero section (see **README.md → "How to add the delegation address at
   launch"**).
2. Swap the two **"Available at launch"** badges in the **Verify us** section for
   real links (Flare Systems Explorer entry + flaremetrics.io profile).
3. Commit and push (Option A) or re-run `wrangler pages deploy .` (Option B).

---

## Design decisions made without explicit direction (for your review)

These were reasonable minimal choices where the brief left a gap. Change any of
them freely:

1. **Accent hex:** used the spec value `#C89F3B`. The V18 logo's triangle samples
   to ~`#CB9E41` — visually identical; `#C89F3B` was kept because it's the
   brand-locked value in the brief.
2. **Body font:** **Inter** via the local/system font stack (no webfont download)
   to keep load fast and avoid an external dependency, per the "no external deps
   if avoidable" requirement. The page also renders cleanly on the OS default sans
   if Inter isn't installed. If you'd prefer a self-hosted or CDN webfont (e.g.
   Satoshi/General Sans), add it in `<head>` and update `--font-body`.
3. **No dark mode toggle.** The brief specifies a white-background, black-text V18
   aesthetic with sparse gold; a dark theme would work against that brand
   direction, so the page is intentionally light-only.
4. **Header logo uses the transparent lockup** (rather than the white-background
   PNG) so it sits cleanly on the frosted sticky header. Both are provided in
   `images/`.
5. **Hero uses the mark-only logo** alongside the header lockup, to avoid showing
   the wordmark twice at large size in the same viewport.
6. **Contact = email only** (`hello@cashlab.network`) plus the GitHub org, since no
   X/social handle exists yet. Add one later per README instructions.
7. **Kept full-resolution source logos** in `images/` as brand originals; the page
   references smaller web-optimized copies for performance.
8. **Relative asset paths** (`images/...`, not `/images/...`) so the site works
   whether it's served from the domain root (Cloudflare Pages) or from a
   subdirectory (preview hosts). Open Graph and canonical tags intentionally keep
   the absolute `https://cashlab.network/...` form, which social crawlers require.
