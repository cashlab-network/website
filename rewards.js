const RPC = "https://flare-api.flare.network/ext/C/rpc";
const WNAT = "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d";
const CSM  = "0xD56c0Ea37B848939B59e6F5Cda119b3fA473b5eB";
const CASHLAB_DELEGATION = "46f75ac75a9e389809b965a876303681d32bcf2e";
const PUBLIC_EXECUTOR    = "4b7905d5cbd4f2ee02aff3c20bbf728ec69e33d4";
const SEL_DELEGATESOF = "0x7de5b8ed", SEL_ISCLAIMEXEC = "0x87962abe";
const pad = a => "0".repeat(24) + a.toLowerCase().replace("0x","");
let META=null, PRICES=null, ROWS=[]; const SHARDS={};

function withTimeout(p, ms) { return Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")), ms))]); }
async function ethCall(to, data) {
  const r = await withTimeout(fetch(RPC, {method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({jsonrpc:"2.0", id:1, method:"eth_call",
                          params:[{to, data}, "latest"]})}), 8000);
  return (await r.json()).result || "0x";
}
async function delegationPct(addr) {  // share of WNat delegated to CashLab, in %
  let res; try { res = await ethCall(WNAT, SEL_DELEGATESOF + pad(addr)); } catch(e) { return null; }
  if (res.length < 260) return null;
  const w = i => res.slice(2 + i*64, 2 + (i+1)*64);
  const offA = parseInt(w(0),16)/32, offB = parseInt(w(1),16)/32;
  const n = parseInt(w(offA),16);
  for (let i=0;i<n;i++)
    if (w(offA+1+i).slice(24) === CASHLAB_DELEGATION)
      return parseInt(w(offB+1+i),16)/100;
  return 0;
}
async function autoclaimOn(addr) {
  let res; try { res = await ethCall(CSM, SEL_ISCLAIMEXEC + pad(addr) + pad(PUBLIC_EXECUTOR)); } catch(e) { return null; }
  return res.endsWith("1");
}
const fmt = (x,d=2) => x.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const day = t => new Date(t*1000).toISOString().slice(0,10);

document.getElementById("go").onclick = async () => {
  const st = document.getElementById("status");
  const addrs = [...new Set((document.getElementById("addrs").value.match(/0x[0-9a-fA-F]{40}/g)||[])
                 .map(a=>a.toLowerCase()))];
  if (!addrs.length) { st.textContent = "Enter at least one valid 0x… address."; return; }
  st.textContent = "Reading the chain…";
  if (!META)  META  = await (await fetch("rewards-data/meta.json")).json();
  if (!PRICES) PRICES = await (await fetch("rewards-data/prices.json")).json();
  ROWS = [];
  let tot=0, del=0, stk=0, cash=0;
  for (const a of addrs) {
    const pre = a.slice(2,4);
    if (!SHARDS[pre]) SHARDS[pre] = await (await fetch("rewards-data/shards/"+pre+".json")).json();
    for (const e of (SHARDS[pre][a]||[])) {
      const p = PRICES.prices[day(e.t)];
      ROWS.push({date:new Date(e.t*1000).toISOString().replace("T"," ").slice(0,16),
                 wallet:a, epoch:e.e, stream:e.s, flr:e.f,
                 usd:p?e.f*p:null, tx:e.x, cash:!!e.c});
      tot+=e.f; if(e.s==="delegation")del+=e.f;
      if(e.s==="staking")stk+=e.f; if(e.c)cash+=e.f;
    }
  }
  ROWS.sort((x,y)=>x.date<y.date?-1:1);
  const dpcts = await Promise.all(addrs.map(delegationPct));
  const autos = await Promise.all(addrs.map(autoclaimOn));
  const dp = dpcts.filter(x=>x!==null);
  document.getElementById("cards").style.display="";
  document.getElementById("c_total").textContent = fmt(tot)+" FLR";
  document.getElementById("c_cash").textContent = fmt(cash)+" FLR";
  document.getElementById("c_del").textContent = fmt(del)+" FLR";
  document.getElementById("c_stk").textContent = fmt(stk)+" FLR";
  document.getElementById("c_dpct").textContent =
      dp.length ? (addrs.length>1 ? dp.map(x=>fmt(x,0)+"%").join(" / ") : fmt(dp[0],0)+"%") : "—";
  document.getElementById("c_auto").textContent =
      autos.every(a=>a===null) ? "— (couldn\u2019t reach Flare RPC)" : autos.every(Boolean) ? "enabled ✓" : autos.some(Boolean) ? "partial" : "not enabled";
  document.getElementById("zero").style.display = ROWS.length ? "none" : "block";
  const tb = document.getElementById("tbody"); tb.innerHTML = "";
  for (const r of ROWS) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.date}</td><td>${r.wallet.slice(0,8)}…</td><td>${r.epoch}</td>
      <td>${r.stream}</td><td>${fmt(r.flr)}</td><td>${r.usd!=null?"$"+fmt(r.usd):"—"}</td>
      <td><a href="https://flare-explorer.flare.network/tx/${r.tx}" target="_blank" rel="noopener">${r.tx.slice(0,10)}…</a></td>`;
    tb.appendChild(tr);
  }
  document.getElementById("tbl").style.display = ROWS.length ? "table" : "none";
  document.getElementById("csv").style.display = ROWS.length ? "inline-block" : "none";
  var follow = document.getElementById("follow");
  if (!follow) { follow = document.createElement("p"); follow.id = "follow";
    follow.style.cssText = "margin-top:14px;font-size:14.5px";
    document.getElementById("status").parentNode.appendChild(follow); }
  var dsum = dp.length ? Math.max.apply(null, dp) : null;
  if (dsum === 0) {
    follow.innerHTML = "This wallet isn\u2019t delegating to CashLab. What our delegators " +
      "earned each epoch, wins and losses alike: <a href=\"/epochs\"><b>epoch reports \u2192</b></a> " +
      "&middot; <a href=\"/delegate\"><b>how to delegate \u2192</b></a>";
  } else if (dsum > 0 && autos.length && !autos.every(Boolean)) {
    follow.innerHTML = "You\u2019re delegating to CashLab \u2014 thank you. Claiming manually? " +
      "Our executor can deliver rewards to your wallet automatically each epoch " +
      "(protocol-minimum fee): <a href=\"/autoclaim\"><b>auto-claim \u2192</b></a>";
  } else { follow.innerHTML = ""; }
  st.textContent = `${ROWS.length} reward receipt(s) · receipts since ${META.history_starts} · data to block ${META.scanned_to_block} · generated ${META.generated_utc}`;
};

document.getElementById("csv").onclick = () => {
  const head = "date_utc,wallet,reward_epoch,stream,amount_flr,flr_usd_price_at_receipt,usd_value_at_receipt,tx\n";
  const lines = ROWS.map(r => {
    const p = r.usd!=null ? (r.usd/r.flr) : "";
    return [r.date,r.wallet,r.epoch,r.stream,r.flr,p&&p.toFixed(8),r.usd!=null?r.usd.toFixed(2):"",r.tx].join(",");
  }).join("\n");
  const blob = new Blob([head+lines+"\n"], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cashlab-rewards-records.csv";
  a.click();
};
