
const RPC = "https://flare-api.flare.network/ext/C/rpc";
const withTimeout = (p,ms=8000)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))]);
const EM  = "0x134b3311C6BdeD895556807a30C7f047D99DfdC2";
const FSM = "0x89e50dc0380e597ece79c8494baafd84537ad0d4";
const ID  = "dde5d41c0b79c25da05ee4e02aececf6eb7e67de";
const pad = a => a.toLowerCase().replace("0x","").padStart(64,"0");

async function call(to, data){
  const r = await withTimeout(fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_call",params:[{to,data},"latest"]})}));
  const j = await r.json();
  if(j.error) throw new Error(j.error.message);
  return j.result;
}
async function blockNumber(){
  const r = await withTimeout(fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_blockNumber",params:[]})}));
  return parseInt((await r.json()).result,16);
}
const set = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };

// selectors (keccak-256 first 4 bytes), precomputed to avoid shipping a hash lib
const SEL = {
  epochId:  "0x70562697", // getCurrentRewardEpochId()
  epochEnd: "0xed54fd63", // currentRewardEpochExpectedEndTs()
  voterAddr:"0xe5771dbc", // getVoterAddresses(address)
  pubKey:   "0x75e68605"  // getPublicKeyOf(address)
};

let endTs = null;
function tick(){
  if(endTs===null) return;
  let s = endTs - Math.floor(Date.now()/1000);
  if(s < 0){ set("countdown","now"); return; }
  const d=Math.floor(s/86400); s%=86400;
  const h=Math.floor(s/3600);  s%=3600;
  const m=Math.floor(s/60);
  set("countdown", (d?d+"d ":"")+h+"h "+m+"m");
}

async function load(){
  try{ set("block", (await blockNumber()).toLocaleString()); }catch(e){ set("block","—"); }

  try{
    const id = parseInt(await call(FSM, SEL.epochId), 16);
    set("epoch", id);
  }catch(e){ set("epoch","—"); }

  try{
    endTs = parseInt(await call(FSM, SEL.epochEnd), 16);
    tick(); setInterval(tick, 30000);
  }catch(e){ set("countdown","—"); }

  try{
    const res = await call(EM, SEL.voterAddr + pad(ID));
    const w = res.replace("0x","").match(/.{64}/g) || [];
    const submit = "0x" + (w[0]||"").slice(24);
    if(submit.length === 42 && !/^0x0+$/.test(submit)){
      set("submitaddr", submit);
      const p = document.getElementById("regstatus");
      p.textContent = "Registered on Flare mainnet";
      p.className = "pill";
    } else {
      set("submitaddr","—");
      const p=document.getElementById("regstatus");
      p.textContent="Not yet registered"; p.className="pill wait";
    }
  }catch(e){
    set("submitaddr","—");
    const p=document.getElementById("regstatus");
    p.textContent="Unable to read chain"; p.className="pill wait";
  }

  try{
    const res = await call(EM, SEL.pubKey + pad(ID));
    const w = res.replace("0x","").match(/.{64}/g) || [];
    const registered = w[0] && !/^0+$/.test(w[0]);
    set("pubkey", registered ? "Registered" : "Not registered");
  }catch(e){ set("pubkey","—"); }
}
load();
setInterval(load, 60000);
