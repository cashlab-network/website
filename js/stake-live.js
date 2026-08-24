
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
    set("stake","—");
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
    set("lastret-stk","—");
  }
}
loadEpoch();
