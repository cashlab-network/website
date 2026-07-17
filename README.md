# CashLab — Landing Site

Production-ready, single-page static landing site for **CashLab**, an independent
multi-protocol Flare Network infrastructure operator.

- **Stack:** plain HTML + inline CSS + a small amount of vanilla JS. No build step,
  no framework, no external runtime dependencies.
- **Hosting target:** [Cloudflare Pages](https://pages.cloudflare.com/) (public
  repo `cashlab-network/website`).
- **Brand:** V18 aesthetic — white background, black text, sparse amber-gold
  accent (`#C89F3B`, matched to the logo). Clean, minimal, professional.

---

## Repository layout

```
cashlab-website/
├── index.html          # The entire page (HTML + inline critical CSS + minimal JS)
├── 404.html            # Branded not-found page
├── robots.txt          # Search-engine directives
├── sitemap.xml         # Single-URL sitemap
├── _headers            # Cloudflare Pages caching + security headers
├── README.md           # This file
├── DEPLOY.md           # Step-by-step Cloudflare Pages deployment guide
└── images/
    ├── cashlab-lockup-header.png     # Full lockup (transparent) — used in header
    ├── cashlab-mark-web.png          # Mark only (transparent) — hero + footer
    ├── og-image.png                  # 1200×630 social share image
    ├── favicon.ico                   # Multi-size favicon
    ├── favicon-32.png / -192 / -512  # PNG favicons
    ├── apple-touch-icon.png          # 180×180 iOS icon
    └── (full-resolution source logos, kept as brand-asset reference)
```

> **Note on images:** the header, hero, footer, and social image reference
> web-optimized copies. The full-resolution V18 source logos
> (`cashlab-lockup.png`, `cashlab-mark.png`, `cashlab-lockup-transparent.png`,
> `cashlab-mono.png`) are kept in `images/` as the authoritative brand originals.
> They are not referenced by the page, so they don't affect load performance, but
> they are available if you ever need to regenerate assets.

---

## Local preview

No build tooling is required. Asset paths are **relative** (`images/...`), so the
site works served from the domain root or any subdirectory. Opening through a
local web server is still recommended over double-clicking the file, so paths and
`fetch()`-based checks behave exactly as they will in production.

```bash
cd cashlab-website
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static server works (e.g. `npx serve`, VS Code Live Server, etc.).

---

## How to update content

All copy lives directly in `index.html`. Edit the text between the relevant
section comments and re-deploy — there is no build step.

Section anchors inside `index.html`:

| Section              | Find this comment            |
| -------------------- | ---------------------------- |
| Hero + tagline       | `<!-- ===== HERO ===== -->`  |
| What we do           | `id="what-we-do"`            |
| Reliability          | `id="reliability"`           |
| How to delegate      | `id="delegate"`              |
| Verify us            | `id="verify"`                |
| Contact              | `id="contact"`               |
| Footer + disclaimer  | `<!-- ===== FOOTER ===== -->` |

Common edits:

- **Change the contact email:** search for `hello@cashlab.network` (appears in the
  contact card and the footer) and replace both occurrences. Update the
  `mailto:` links too.
- **Add an X / social handle:** add a link in the Contact section's
  `.contact__grid` and in the `.footer__links` nav.
- **Update the fee statement or protocol references:** edit the `.note` blocks in
  the "What we do" and "Reliability" sections.
- **Update SEO / social preview text:** edit the `<title>`, `<meta name="description">`,
  and the Open Graph / Twitter `<meta>` tags in `<head>`.

Every claim on the page is intentionally factual and defensible. When editing,
**do not add** uptime percentages, APR figures, ROI projections, "best in class"
language, or a delegation address until those are real and verified.

---

## How to add the delegation address at launch

The delegation address is intentionally a placeholder until Flare mainnet launch.
Its exact location is flagged in `index.html` with:

```html
<!-- REPLACE AT LAUNCH: delegation-address -->
```

At launch, in the **Hero** section, replace the placeholder `<code>` block:

```html
<code class="status-card__addr" id="delegation-address">
  Delegation address &mdash; published at Flare mainnet launch
</code>
```

with the live address, e.g.:

```html
<code class="status-card__addr" id="delegation-address">0xYOUR_LIVE_DELEGATION_ADDRESS</code>
```

Keep the same element and `class="status-card__addr"` so the styling stays intact.
You may also want to soften the status-card copy above it (e.g. change
"Delegation opens with Flare mainnet launch..." to "Delegation is live. Delegate
your WFLR vote power to the address below.").

While you're at it, in the **Verify us** section, swap the two
`Available at launch` badges for real links once the entity is indexed. Each is
flagged with a `<!-- REPLACE AT LAUNCH: ... -->` comment:

```html
<!-- Before -->
<span class="pill pill--soon">Available at launch</span>
<!-- After -->
<a class="pill pill--link" href="https://flare-systems-explorer.flare.network/..." target="_blank" rel="noopener noreferrer">View entry &nbsp;&rarr;</a>
```

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full, step-by-step Cloudflare Pages guide,
including custom-domain wire-up for `cashlab.network`.

---

## License / ownership

© CashLab. Logo assets are proprietary CashLab brand marks — do not modify.
