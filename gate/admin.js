(function () {
  var $ = function (id) { return document.getElementById(id); };
  var current = null; var timer = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function msg(t, kind) { var m = $('msg'); m.textContent = t || ''; m.className = 'msg ' + (kind || 'err') + (t ? '' : ' hidden'); }
  function api(url, data) {
    var opt = { credentials: 'same-origin' };
    if (data) { opt.method = 'POST'; opt.headers = { 'content-type': 'application/json' }; opt.body = JSON.stringify(data); }
    return fetch(url, opt).then(function (r) {
      if (r.status === 403) { location.href = '/'; throw new Error('not admin'); }
      return r.json().then(function (j) { if (!r.ok || j.error) throw new Error(j.error || ('HTTP ' + r.status)); return j; });
    });
  }

  function project(c) {
    current = c.code;
    $('projector').classList.remove('hidden');
    $('pcode').textContent = c.code; $('pbatch').textContent = c.batchNo; $('pend').textContent = c.endDate;
    $('pmax').textContent = '/ ' + c.maxUses; $('pcount').textContent = c.used || 0; $('pnames').textContent = '';
    clearInterval(timer); timer = setInterval(refreshCount, 4000); refreshCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function refreshCount() {
    if (!current) return;
    api('/api/admin/joined?code=' + encodeURIComponent(current)).then(function (j) {
      $('pcount').textContent = j.joined; $('pnames').textContent = j.names.length ? 'Latest: ' + j.names.join(', ') : '';
    }).catch(function () {});
  }
  $('hide').onclick = function () { current = null; clearInterval(timer); $('projector').classList.add('hidden'); };

  function loadCodes() {
    return api('/api/admin/codes').then(function (j) {
      var rows = j.codes.map(function (c) {
        var open = c.state === 'open';
        return '<tr><td class="mono">' + esc(c.code) + '</td><td>' + esc(c.batchNo) + '</td><td>' + esc(c.accessDate) + '</td><td>' + esc(c.endDate) +
          '</td><td>' + esc(c.used) + ' / ' + esc(c.maxUses) + '</td><td><span class="pill ' + (open ? 'open' : 'shut') + '">' + esc(c.state) + '</span></td><td>' +
          '<button class="small" data-a="show" data-c="' + esc(c.code) + '">Show</button>' +
          (open ? '<button class="small danger" data-a="close" data-c="' + esc(c.code) + '">Close</button>' : '') +
          '<button class="small ghost" data-a="regenerate" data-c="' + esc(c.code) + '">Regenerate</button></td></tr>';
      });
      $('codes').innerHTML = rows.join('') || '<tr><td colspan="7" class="muted">No codes yet. Create one above.</td></tr>';
      window.__codes = j.codes;
    }).catch(function (e) { msg('Could not load codes: ' + e.message); });
  }
  $('codes').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var code = b.getAttribute('data-c'); var a = b.getAttribute('data-a');
    if (a === 'show') { var c = (window.__codes || []).filter(function (x) { return x.code === code; })[0]; if (c) project(c); return; }
    if (a === 'close' && !confirm('Close ' + code + '? Students of this batch will be blocked.')) return;
    if (a === 'regenerate' && !confirm('Make a new code for this batch? The old code stops working; students who already joined keep access.')) return;
    b.disabled = true;
    api('/api/admin/codes', { action: a, code: code }).then(function (j) {
      msg(a === 'close' ? code + ' closed.' : 'New code ' + j.code.code + ' created.', 'ok');
      if (a === 'regenerate') project(j.code); else if (current === code) $('hide').onclick();
      loadCodes();
    }).catch(function (e2) { b.disabled = false; msg(e2.message); });
  });

  $('create').addEventListener('submit', function (e) {
    e.preventDefault(); $('createbtn').disabled = true; msg('');
    api('/api/admin/codes', { action: 'create', batchNo: $('batch').value, endDate: $('end').value, maxUses: $('max').value })
      .then(function (j) { $('createbtn').disabled = false; project(j.code); loadCodes(); })
      .catch(function (e2) { $('createbtn').disabled = false; msg(e2.message); });
  });

  function loadLogins() {
    return api('/api/admin/logins').then(function (j) {
      $('logins').innerHTML = j.logins.map(function (l) {
        return '<tr><td>' + esc(l.time) + '</td><td>' + esc(l.gmail) + '</td><td>' + esc(l.name) + '</td><td>' + esc(l.batch) + '</td><td><span class="pill ' + esc(l.result) + '">' + esc(l.result) + '</span></td><td>' + esc(l.reason) + '</td></tr>';
      }).join('') || '<tr><td colspan="6" class="muted">No sign-ins yet.</td></tr>';
    }).catch(function () {});
  }

  $('out').onclick = function () { fetch('/api/logout', { method: 'POST' }).then(function () { location.href = '/'; }); };

  fetch('/api/me', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (me) {
    if (!me.signedIn || me.role !== 'admin') { location.href = '/'; return; }
    $('who').textContent = 'Signed in as ' + me.email;
    if (me.sheetUrl) $('sheetlink').href = me.sheetUrl; else $('sheetlink').classList.add('hidden');
    var d = new Date(Date.now() + 6 * 86400000); $('end').value = d.toISOString().slice(0, 10);
    loadCodes(); loadLogins(); setInterval(loadLogins, 15000);
  });
})();
