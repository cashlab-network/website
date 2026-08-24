#!/usr/bin/env python3
"""Stamp every local <script src> with ?v=<content-hash-8>.

Auditor 2026-08-24 item 2: a Cloudflare layer above Pages serves /js/* with
max-age=14400 regardless of _headers, so after any deploy a warm browser can
run new HTML against 4h-old JS (the stake-tile placeholder bug). A changed
file changes its hash, the URL changes, the cache can never serve stale.

Run BEFORE every push that touches a .js file (see DEPLOY.md). Idempotent.
"""
import hashlib, pathlib, re, sys

root = pathlib.Path(__file__).parent
stamped = 0
for page in sorted(root.glob('*.html')):
    s = page.read_text()
    def sub(m):
        global stamped
        src = m.group(2)
        f = root / src.split('?')[0]
        if not f.exists():
            return m.group(0)
        h = hashlib.sha256(f.read_bytes()).hexdigest()[:8]
        new = f'{m.group(1)}{src.split("?")[0]}?v={h}{m.group(3)}'
        if new != m.group(0):
            stamped += 1
        return new
    out = re.sub(r'(<script src=")((?:js/)?[A-Za-z0-9_.-]+\.js(?:\?v=[0-9a-f]+)?)(")', sub, s)
    if out != s:
        page.write_text(out)
        print(f'{page.name}: stamped')
print(f'{stamped} references stamped')
