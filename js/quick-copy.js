// One-tap copy for the delegation address / validator node ID (delegate, stake).
// External file on purpose: the site's Content-Security-Policy is script-src 'self',
// so inline handlers never run in production.
(function () {
  function copy(text, note) {
    var done = function () {
      note.textContent = 'Copied. Paste it in the Portal.';
      setTimeout(function () { note.textContent = ''; }, 4000);
    };
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); }
      catch (e) { note.textContent = 'Long-press the address above to copy it.'; }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  }
  var buttons = document.querySelectorAll('[data-copy]');
  for (var i = 0; i < buttons.length; i++) {
    (function (b) {
      b.addEventListener('click', function () {
        copy(b.getAttribute('data-copy'), document.getElementById(b.getAttribute('data-note')));
      });
    })(buttons[i]);
  }
})();
