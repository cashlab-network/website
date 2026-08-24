
"use strict";
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const fmt2 = n => n.toFixed(2);
const fmtI = n => n.toLocaleString("en-US");

function el(name, attrs, text){
  const e = document.createElementNS(NS, name);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(text !== undefined) e.textContent = text;
  return e;
}

function makeTip(fig){
  const t = document.createElement("div");
  t.className = "tt";
  fig.appendChild(t);
  return {
    show(html, x, y){
      t.innerHTML = html;
      t.style.display = "block";
      const fw = fig.clientWidth, tw = t.offsetWidth;
      let left = x + 14;
      if(left + tw > fw - 6) left = x - tw - 14;
      t.style.left = Math.max(6, left) + "px";
      t.style.top = Math.max(6, y - t.offsetHeight - 8) + "px";
    },
    hide(){ t.style.display = "none"; }
  };
}

// Shared frame: category x-axis of epoch numbers, linear y.
function frame(svg, epochs, ymin, ymax, yticks, yfmt){
  const W = 720, H = 240, L = 46, R = 16, T = 14, B = 28;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const iw = W - L - R, ih = H - T - B, n = epochs.length;
  const x = i => L + (n === 1 ? iw/2 : (i + 0.5) * iw / n);
  const y = v => T + ih * (1 - (v - ymin) / (ymax - ymin));
  for(const tv of yticks){
    svg.appendChild(el("line", {x1:L, x2:W-R, y1:y(tv), y2:y(tv), class:"gridline"}));
    svg.appendChild(el("text", {x:L-7, y:y(tv)+4, "text-anchor":"end", class:"axis"}, yfmt(tv)));
  }
  const step = Math.max(1, Math.ceil(n / 12));
  epochs.forEach((ep, i) => {
    if(i % step === 0 || i === n-1)
      svg.appendChild(el("text", {x:x(i), y:H-8, "text-anchor":"middle", class:"axis"}, ep));
  });
  return {x, y, W, H, L, R, T};
}

function polyline(svg, pts, color, dashed){
  if(pts.length < 2) return;
  const a = {points: pts.map(p => p.join(",")).join(" "), fill:"none",
             "stroke-width":"2", "stroke-linejoin":"round", "stroke-linecap":"round",
             style:`stroke:${color}`};
  if(dashed) a["stroke-dasharray"] = "5 4";
  svg.appendChild(el("polyline", a));
}

function marker(svg, cx, cy, color){
  svg.appendChild(el("circle", {cx, cy, r:"4", style:`fill:${color};stroke:var(--bg)`,
                                "stroke-width":"2"}));
}

function hit(svg, cx, cy, tip, html){
  const h = el("circle", {cx, cy, r:"15", fill:"transparent"});
  h.addEventListener("mouseenter", () => {
    const sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    tip.show(html, (cx - vb.x) * sr.width / vb.width,
                   (cy - vb.y) * sr.height / vb.height);
  });
  h.addEventListener("mouseleave", tip.hide);
  svg.appendChild(h);
}

function chartAccuracy(eps){
  const fig = $("fig-acc"); fig.innerHTML = "";
  const svg = el("svg", {role:"img",
    "aria-label":"Line chart of FTSO accuracy percentage per reward epoch against the 80 percent gate"});
  const lo = Math.min(70, Math.floor(Math.min(...eps.map(e => e.gates.ftso.pct)) / 10) * 10);
  const ticks = []; for(let v = lo; v <= 100; v += 10) ticks.push(v);
  const f = frame(svg, eps.map(e => e.epoch), lo, 100, ticks, v => v + "%");
  // 80% FIP.10 gate
  svg.appendChild(el("line", {x1:f.L, x2:f.W-f.R, y1:f.y(80), y2:f.y(80),
    "stroke-dasharray":"5 4", "stroke-width":"1.5", style:"stroke:var(--muted)"}));
  svg.appendChild(el("text", {x:f.W-f.R, y:f.y(80)-5, "text-anchor":"end", class:"axis"}, "80% gate"));
  const pts = eps.map((e, i) => [f.x(i), f.y(e.gates.ftso.pct)]);
  polyline(svg, pts, "var(--s1)");
  fig.appendChild(svg);
  const tip = makeTip(fig);
  const labelStep = Math.max(1, Math.ceil(eps.length / 10));
  eps.forEach((e, i) => {
    const [cx, cy] = pts[i], g = e.gates.ftso;
    marker(svg, cx, cy, "var(--s1)");
    if(i % labelStep === 0 || i === eps.length-1)
      svg.appendChild(el("text", {x:cx, y:cy + (g.pct >= 80 ? -11 : 16),
        "text-anchor":"middle", class:"axis",
        style:"font-weight:600;fill:var(--fg)"}, fmt2(g.pct) + "%"));
    hit(svg, cx, cy, tip,
      `<strong>Epoch ${e.epoch}</strong> · ${e.dates.human}<br>` +
      `FTSO accuracy ${fmt2(g.pct)}% <span style="color:var(--muted)">` +
      `(${fmtI(g.num)} / ${fmtI(g.den)})</span><br>` +
      (g.pass ? `<span class="chip pass">✓ gate passed</span>`
              : `<span class="chip fail">✗ below the 80% gate</span>`));
  });
}

function chartApr(eps){
  const fig = $("fig-apr"); fig.innerHTML = "";
  const svg = el("svg", {role:"img",
    "aria-label":"Line chart of realized delegation and staking APR percentages per reward epoch"});
  const top = Math.max(1, ...eps.map(e => Math.max(e.returns.delegationAprPct, e.returns.stakingAprPct)));
  const stepv = top > 20 ? 10 : top > 8 ? 5 : top > 3 ? 2 : 1;
  const hi = Math.ceil(top * 1.15 / stepv) * stepv;
  const ticks = []; for(let v = 0; v <= hi; v += stepv) ticks.push(v);
  const f = frame(svg, eps.map(e => e.epoch), 0, hi, ticks, v => v + "%");
  const dpts = eps.map((e, i) => [f.x(i), f.y(e.returns.delegationAprPct)]);
  const spts = eps.map((e, i) => [f.x(i), f.y(e.returns.stakingAprPct)]);
  polyline(svg, spts, "var(--s2)");
  polyline(svg, dpts, "var(--s1)");
  fig.appendChild(svg);
  const tip = makeTip(fig);
  const last = eps.length - 1;
  eps.forEach((e, i) => {
    const r = e.returns;
    marker(svg, spts[i][0], spts[i][1], "var(--s2)");
    marker(svg, dpts[i][0], dpts[i][1], "var(--s1)");
    if(i === last){ // direct labels on the newest point
      svg.appendChild(el("text", {x:spts[i][0], y:spts[i][1]-11, "text-anchor":"middle",
        class:"axis", style:"font-weight:600;fill:var(--fg)"}, "Staking " + fmt2(r.stakingAprPct) + "%"));
      svg.appendChild(el("text", {x:dpts[i][0], y:dpts[i][1]+18, "text-anchor":"middle",
        class:"axis", style:"font-weight:600;fill:var(--fg)"}, "Delegation " + fmt2(r.delegationAprPct) + "%"));
    }
    hit(svg, dpts[i][0], (dpts[i][1] + spts[i][1]) / 2, tip,
      `<strong>Epoch ${e.epoch}</strong> · ${e.dates.human}<br>` +
      `Delegation ${fmt2(r.delegationAprPct)}% <span style="color:var(--muted)">` +
      `· median ${fmt2(r.medians.delegationAprPct)}%</span><br>` +
      `Staking ${fmt2(r.stakingAprPct)}% <span style="color:var(--muted)">` +
      `· median ${fmt2(r.medians.stakingAprPct)}%</span>`);
  });
}

function ifel(id, fn){ const el = $(id); if (el) fn(el); }
function cell(html){ const td = document.createElement("td"); td.innerHTML = html; return td; }

function renderTable(eps){
  const tb = $("history-body"); tb.innerHTML = "";
  [...eps].reverse().forEach(e => {
    const g = e.gates, r = e.returns, tr = document.createElement("tr");
    const chip = ok => ok ? "" : ' <span class="chip fail">✗</span>';
    tr.appendChild(cell(`<span class="num">${e.epoch}</span>`));
    tr.appendChild(cell(`<span class="num">${fmt2(r.delegationAprPct)}%</span>` +
      `<span class="frac">median ${fmt2(r.medians.delegationAprPct)}%</span>`));
    tr.appendChild(cell(`<span class="num">${fmt2(r.stakingAprPct)}%</span>` +
      `<span class="frac">median ${fmt2(r.medians.stakingAprPct)}%</span>`));
    tr.appendChild(cell(e.paid ? '<span class="verdict paid">PAID</span>'
                               : '<span class="verdict zero">PAID ZERO</span>'));
    tr.appendChild(cell(`<span style="color:var(--muted)">${e.dates.human}</span>`));
    tr.appendChild(cell(`<span class="num">${fmt2(g.ftso.pct)}%</span>${chip(g.ftso.pass)}` +
      `<span class="frac">${fmtI(g.ftso.num)} / ${fmtI(g.ftso.den)}</span>`));
    tr.appendChild(cell(`<span class="num">${g.fdc.pct.toFixed(1)}%</span>${chip(g.fdc.pass)}` +
      `<span class="frac">${fmtI(g.fdc.num)} / ${fmtI(g.fdc.den)}</span>`));
    tr.appendChild(cell(`<span class="num">${g.staking.uptimePct}%</span>${chip(g.staking.pass)}` +
      `<span class="frac">${fmtI(g.staking.selfBond)} FLR bond</span>`));
    tr.appendChild(cell(`<span class="num">${g.fastUpdates.actual}</span>${chip(g.fastUpdates.pass)}` +
      `<span class="frac">vs ${g.fastUpdates.expected} expected</span>`));
    tb.appendChild(tr);
  });
}

function renderSnapshot(doc){
  const s = doc.snapshot;
  if(!s || !s.activeStake || !s.feeds){
    $("tile-stake").textContent = "—";
    $("tile-feeds").textContent = "—";
    $("tile-stake-sub").textContent = "snapshot missing from epochs.json";
    $("tile-feeds-sub").textContent = "snapshot missing from epochs.json";
    return;
  }
  const human = (iso) => { const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString("en-US", {month:"short", day:"numeric",
      hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"UTC"}) + " UTC"; };
  const asOf = human(s.asOf || doc.generated_at || "");
  $("tile-stake").textContent = fmtI(s.activeStake.flr) + " FLR";
  $("tile-stake-sub").textContent = "as of " + asOf + " · chain read";
  $("tile-stake").closest(".card").setAttribute("data-source", s.activeStake.source || "");
  $("tile-feeds").textContent = fmtI(s.feeds.configured);
  $("tile-feeds-sub").textContent = "as of " + asOf + " · control plane";
  $("tile-feeds").closest(".card").setAttribute("data-source", s.feeds.source || "");
}

function renderTiles(eps){
  const latest = eps[eps.length - 1], g = latest.gates;
  $("tile-uptime").textContent = g.staking.uptimePct + "%";
  $("tile-uptime-sub").textContent = `read at epoch-${latest.epoch} report publication`;
  // Pass buffer (auditor 2026-08-24 item 3): renders ONLY when the pipeline
  // emits conditions — never hand-typed, hidden until the data exists.
  if (latest.conditions && typeof latest.conditions.passBalanceAfter === "number") {
    const card = document.getElementById("tile-pass-card");
    if (card) {
      // "of 3" is the FIP.10 pass cap (protocol constant, not our data).
      $("tile-pass").textContent = latest.conditions.passBalanceAfter + " of 3";
      // Corrected rule (auditor spec 2026-08-24, verified against 793
      // provider-epoch records): one pass burns per failed CONDITION, not
      // per failed epoch. The wiped-epoch clause is derived, never typed.
      const wiped = eps.filter(e => !e.paid).pop();
      let wipedClause = "";
      if (wiped) {
        const wg = wiped.gates;
        const nf = [wg.ftso.pass, wg.fdc.pass, wg.staking.pass,
                    wg.fastUpdates.pass].filter(p => !p).length;
        wipedClause = ` — that's what happened in epoch ${wiped.epoch}, ` +
          `which failed ${nf} condition${nf === 1 ? "" : "s"}` +
          (wiped.conditions && wiped.conditions.passesHeld === 0
            ? ` with no passes banked` : ``);
      }
      $("tile-pass-sub").textContent =
        `settled through epoch ${latest.epoch} · each failed condition ` +
        `burns one banked pass instead of zeroing the epoch — delegators ` +
        `still get paid; at zero, a single failure pays nothing` + wipedClause;
      card.style.display = "";
    }
  }
  const passed = [g.ftso.pass, g.fdc.pass, g.staking.pass, g.fastUpdates.pass]
                 .filter(Boolean).length;
  $("tile-epoch").innerHTML = `${latest.epoch} · ` + (latest.paid
    ? '<span class="verdict paid">PAID</span>'
    : '<span class="verdict zero">PAID ZERO</span>');
  $("tile-epoch-sub").textContent = `${passed}/4 gates passed · settled data`;
}

function fail(msg){
  for(const id of ["fig-acc", "fig-apr"])
    ifel(id, el => el.innerHTML = `<div class="placeholder">${msg}</div>`);
  ifel("history-body", el => el.innerHTML =
    `<tr><td colspan="9" style="color:var(--muted)">${msg}</td></tr>`);
  for(const id of ["tile-stake", "tile-feeds", "tile-uptime", "tile-epoch"])
    ifel(id, el => el.textContent = "—");
}

async function load(){
  let doc;
  try{
    const res = await fetch("epochs.json", {cache: "no-cache"});
    if(!res.ok) throw new Error("HTTP " + res.status);
    doc = await res.json();
  }catch(err){
    fail("Could not load epochs.json (" + err.message +
         "). If you opened this file directly from disk, serve it over " +
         "HTTP — or fetch /epochs.json yourself; it is the complete dataset.");
    return;
  }
  const eps = (doc.epochs || []).slice().sort((a, b) => a.epoch - b.epoch);
  if(!eps.length){ fail("epochs.json contains no epochs yet."); return; }
  try{
    if ($("tile-stake")) renderSnapshot(doc);
    if ($("tile-epoch")) renderTiles(eps);
    if ($("fig-acc")) chartAccuracy(eps);
    if ($("fig-apr")) chartApr(eps);
    if ($("history-body")) renderTable(eps);
    const gen = doc.generated_at || doc.generated;
    if(gen && $("gen"))
      $("gen").textContent = " Dataset generated " + gen +
                             " · " + eps.length + " epoch" + (eps.length > 1 ? "s" : "") + ".";
  }catch(err){
    fail("epochs.json loaded but could not be rendered: " + err.message);
  }
}
load();
