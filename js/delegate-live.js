
const RPC = "https://flare-api.flare.network/ext/C/rpc";
const WNAT = "0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d";
const DELEG = "46f75ac75a9e389809b965a876303681d32bcf2e";
const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };

async function load(){
  try{
    // votePowerOf(address) — address left-padded to 32 bytes
    const data = "0x142d1018" + "0".repeat(24) + DELEG;
    const r = await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_call",params:[{to:WNAT,data},"latest"]})});
    const j = await r.json();
    if(j.error) throw new Error(j.error.message);
    const wflr = Number(BigInt(j.result) / 10n**18n);
    set("votepower", wflr.toLocaleString() + " WFLR");
  }catch(e){
    set("votepower","—");
  }
}
load();
setInterval(load, 60000);

// F2: last settled epoch's realized delegation return, from the same
// pipeline-verified epochs.json the Track Record page renders
async function loadEpoch(){
  try{
    const r = await fetch("/epochs.json", {cache:"no-store"});
    const j = await r.json();
    const e = j.epochs.reduce((a,b)=>a.epoch>b.epoch?a:b);
    const apr = e.returns.delegationAprPct;
    const med = e.returns.medians.delegationAprPct;
    set("lastret", apr.toFixed(2) + "% APR");
    set("lastret-sub", "epoch " + e.epoch + " · net of fee · network median " + med.toFixed(2) + "%");
  }catch(_){
    set("lastret","—");
  }
}
loadEpoch();
