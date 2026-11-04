/* Proteção contra cópia */
(function () {
  var field = function (el) { return el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]'); };
  var block = function (e) { e.preventDefault(); e.stopPropagation(); return false; };
  document.addEventListener('contextmenu', block, true);
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (k === 'f12' || e.keyCode === 123) return block(e);
    if (c && e.shiftKey && ['i', 'j', 'c', 'k'].indexOf(k) > -1) return block(e);
    if (c && e.altKey && ['i', 'j', 'c', 'u'].indexOf(k) > -1) return block(e);
    if (c && ['u', 's', 'p'].indexOf(k) > -1) return block(e);
    if (c && ['a', 'c', 'v', 'x'].indexOf(k) > -1 && !field(e.target)) return block(e);
  }, true);
  ['copy', 'cut', 'paste', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!field(e.target)) block(e); }, true);
  });
  document.addEventListener('dragstart', function (e) { if (!field(e.target)) block(e); }, true);
  var s = document.createElement('style');
  s.textContent = 'html,body{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none}input,textarea,select{-webkit-user-select:text;user-select:text}img{-webkit-user-drag:none;user-drag:none;pointer-events:auto}';
  document.documentElement.appendChild(s);
})();
