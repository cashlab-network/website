/* Live-numbers band: renders the last settled epoch from /epochs.json.
   Generated data only — nothing here is ever hand-typed (design-audit F2). */
(async function () {
  try {
    var r = await fetch("/epochs.json"); var d = await r.json();
    var eps = d.epochs || d; if (!eps.length) return;
    var e = eps[eps.length - 1];
    var streak = 0;
    for (var i = eps.length - 1; i >= 0 && eps[i].paid; i--) streak++;
    var g = e.gates, passed = ["ftso","fdc","staking","fastUpdates"]
      .filter(function(k){ return g[k] && g[k].pass; }).length;
    document.getElementById("ln-title").textContent =
      "Last settled epoch (" + e.epoch + ", " + e.dates.human + ")";
    document.getElementById("ln-del").textContent = e.returns.delegationAprPct + "%";
    document.getElementById("ln-del-med").textContent =
      "network median " + e.returns.medians.delegationAprPct + "%";
    document.getElementById("ln-stk").textContent = e.returns.stakingAprPct + "%";
    document.getElementById("ln-stk-med").textContent =
      "network median " + e.returns.medians.stakingAprPct + "%";
    document.getElementById("ln-gates").textContent = passed + "/4 passed";
    document.getElementById("ln-paid").textContent =
      streak + " consecutive paid epoch" + (streak === 1 ? "" : "s");
    document.getElementById("ln-root").style.display = "";
  } catch (err) { /* band stays hidden on any failure — never a broken strip */ }
})();
