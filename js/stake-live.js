
const RPC = "https://flare-api.flare.network/ext/C/rpc";
const withTimeout = (p,ms=8000)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))]);
const MIRROR = "0x7b61F9F27153a4F2F57Dc30bF08A8eb0cCB96C22";
const NODE20 = "51daf9e19d292505b4a259ebb334129ac09c4e4e"; // bytes20 of our NodeID
const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };

async function load(){
  try{
    // votePowerOf(bytes20) — bytes20 is right-padded in ABI encoding
    const data = "0xb4eb2a81" + NODE20 + "0".repeat(24);
    const r = await withTimeout(fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_call",params:[{to:MIRROR,data},"latest"]})}));
    const j = await r.json();
    if(j.error) throw new Error(j.error.message);
    const flr = Number(BigInt(j.result) / 10n**18n);
    if(flr > 0){
      set("stake", flr.toLocaleString() + " FLR");
      const p = document.getElementById("vstatus");
      p.textContent = "Active"; p.className = "pill";
    } else {
      set("stake", "0 FLR");
      const p = document.getElementById("vstatus");
      p.textContent = "Between terms"; p.className = "pill wait";
    }
  }catch(e){
    set("stake","-");
    const p=document.getElementById("vstatus");
    p.textContent="Unable to read chain"; p.className="pill wait";
  }
}
load();
setInterval(load, 60000);

// Staking-at-a-glance: last settled epoch's realized staking return, from
// the same pipeline-verified epochs.json the Track Record page renders.
async function loadEpoch(){
  try{
    const r = await withTimeout(fetch("/epochs.json", {cache:"no-store"}));
    const j = await r.json();
    const e = j.epochs.reduce((a,b)=>a.epoch>b.epoch?a:b);
    const apr = e.returns.stakingAprPct;
    const med = e.returns.medians.stakingAprPct;
    set("lastret-stk", apr.toFixed(2) + "% APR");
    set("lastret-stk-sub", "epoch " + e.epoch + " · net of fee · network median " + med.toFixed(2) + "%");
  }catch(_){
    set("lastret-stk","-");
  }
}
loadEpoch();

// Staking-at-a-glance: the validator's live P-chain stake, read by your
// browser from Flare's public P-chain API (platform.getCurrentValidators).
// Total stake on a Flare validator is capped at 15 x its own bond, so the
// room-for-new-stake figure is cap minus what is already there.
const PCHAIN = "https://flare-api.flare.network/ext/bc/P";
const NODE_ID = "NodeID-8Tp4GLFefnrLzzD7YU6qvEzDRRT1L6Zec";
const CAP_MULTIPLE = 15n;

// Capacity timeline: from the same live validator record, show WHEN room
// reopens (each current stake's end date) and how much, so a prospective
// staker knows when to come back. Maturities that land on the term's own end
// date are the re-bond, shown as a note rather than a within-term opening.
function renderTimeline(v, room, cap, nano){
  const el = id => document.getElementById(id);
  const capNow = el("cap-now"), plain = el("cap-now-plain"),
        more = el("cap-more"), rows = el("cap-rows"), reb = el("cap-rebond");
  if(!capNow) return;
  const roomN = Number(room), capN = Number(cap);
  // human-readable: millions get one decimal, smaller stays comma-grouped
  const human = n => n >= 1e6 ? (n/1e6).toFixed(1) + " million FLR"
                             : Math.round(n).toLocaleString() + " FLR";
  const fmt = (t,o) => new Date(t).toLocaleDateString(undefined, Object.assign({timeZone:"UTC"}, o)); // UTC: the on-chain end instant, not the viewer's local day

  // group each current stake's end date (within this term) by UTC day
  const vEnd = Number(v.endTime), byDay = new Map();
  for(const d of (v.delegators || [])){
    const end = Number(d.endTime);
    if(end >= vEnd - 3600) continue;               // ends with the term itself -> the re-bond note, not a within-term opening
    const day = new Date(end * 1000); day.setUTCHours(0,0,0,0);
    byDay.set(day.getTime(), (byDay.get(day.getTime()) || 0) + Number(BigInt(d.weight || "0") / nano));
  }
  const days = [...byDay.entries()].sort((a,b)=>a[0]-b[0]);

  // headline figure + a plain-English sentence explaining what it means
  capNow.textContent = roomN > 0 ? human(roomN) : "None";
  if(plain){
    if(roomN <= 0){
      plain.textContent = days.length
        ? "The validator is full right now. The next room opens " + fmt(days[0][0],{month:"long",day:"numeric"}) + ", shown below."
        : "The validator is full right now.";
    } else if(roomN < capN * 0.03){
      plain.textContent = "The validator is nearly full: " + human(capN-roomN) + " of a " + human(capN)
        + " limit is already staked, so only about " + human(roomN) + " more fits right now. More opens on the dates below.";
    } else {
      plain.textContent = "You can stake up to about " + human(roomN) + " right now, out of a " + human(capN) + " limit.";
    }
  }

  // when more room opens: date + how much, in plain words
  if(rows){
    rows.innerHTML = "";
    for(const [k,opens] of days){
      const tr = document.createElement("tr");
      const c1 = document.createElement("td"); c1.textContent = fmt(k,{month:"short",day:"numeric"});
      const c2 = document.createElement("td"); c2.textContent = "about " + human(opens) + " of room opens up";
      tr.append(c1,c2); rows.appendChild(tr);
    }
  }
  if(more) more.hidden = days.length === 0;

  if(reb){
    reb.textContent = "The current staking term ends " + fmt(vEnd*1000,{month:"long",day:"numeric",year:"numeric"})
      + ", when the stake re-bonds and the available room is set fresh.";
  }
}

async function loadPChain(){
  try{
    const r = await withTimeout(fetch(PCHAIN,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"platform.getCurrentValidators",params:{nodeIDs:[NODE_ID]}})}));
    const j = await r.json();
    const v = j.result && j.result.validators && j.result.validators[0];
    if(!v) throw new Error("validator not in the current set");
    const own = BigInt(v.weight || "0"), del = BigInt(v.delegatorWeight || "0");
    const nano = 1000000000n;
    const total = (own + del) / nano, ownF = own / nano, delF = del / nano;
    const cap = (own * CAP_MULTIPLE) / nano;
    const room = cap > total ? cap - total : 0n;
    set("pstake-total", Number(total).toLocaleString() + " FLR");
    set("pstake-sub", Number(ownF).toLocaleString() + " own bond + " + Number(delF).toLocaleString() + " from stakers");
    set("pstake-count", String(v.delegatorCount ?? (v.delegators ? v.delegators.length : "-")));
    if(room === 0n){
      // capacity reopens when the earliest current stake matures (or at the next term)
      const dels = (v.delegators || []).map(d => ({ end: Number(d.endTime), w: BigInt(d.weight || "0") / nano }));
      const soon = dels.length ? dels.reduce((a, b) => (a.end < b.end ? a : b)) : null;
      const when = soon ? new Date(soon.end * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "the next term";
      set("pstake-room", "Full");
      set("pstake-room-sub", "at the cap of " + Number(cap).toLocaleString() + " FLR (15 x own bond); " + (soon ? Number(soon.w).toLocaleString() + " FLR matures " + when : "until " + when));
    } else {
      set("pstake-room", Number(room).toLocaleString() + " FLR");
      set("pstake-room-sub", "of a " + Number(cap).toLocaleString() + " FLR cap (15 x own bond)");
    }
    renderTimeline(v, room, cap, nano);
  }catch(e){
    set("pstake-total","-"); set("pstake-count","-"); set("pstake-room","-");
    set("pstake-sub","could not reach the P-chain API");
  }
}
loadPChain();
setInterval(loadPChain, 60000);
