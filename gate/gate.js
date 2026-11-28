(function () {
  var $ = function (id) { return document.getElementById(id); };
  function show(id, on) { $(id).classList.toggle('hidden', !on); }
  function msg(text, kind) { var m = $('msg'); m.textContent = text || ''; m.className = 'msg ' + (kind || 'err') + (text ? '' : ' hidden'); }
  function post(url, data) {
    return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data || {}) })
      .then(function (r) { return r.json().catch(function () { return { status: 'error', message: 'Server error ' + r.status }; }); });
  }

  function handle(r) {
    msg('');
    if (r.status === 'admin') { show('signin', false); show('form', false); show('admin', true); show('out', true); $('aname').textContent = r.name || r.email; return; }
    if (r.status === 'approved') { msg('Access OK. Opening the lab…', 'ok'); location.href = '/lab/'; return; }
    if (r.status === 'form' || r.status === 'ended') {
      show('signin', false); show('form', true); show('out', true);
      $('gmail').value = r.email || ''; if (!$('fname').value) $('fname').value = r.name || '';
      if (r.status === 'ended') msg('Your batch access has ended. If you are in a new batch, type the new batch code below.');
      return;
    }
    msg(r.message || 'Something went wrong. Try again.');
  }

  $('joinform').addEventListener('submit', function (e) {
    e.preventDefault();
    $('joinbtn').disabled = true;
    post('/api/join', { name: $('fname').value, icai: $('icai').value, city: $('city').value, code: $('code').value })
      .then(function (r) {
        $('joinbtn').disabled = false;
        if (r.status === 'approved') return handle(r);
        msg(r.message || 'Code not valid - ask your tutor');
      });
  });
  $('out').addEventListener('click', function () { post('/api/logout').then(function () { location.href = '/'; }); });

  if (/[?&]ended=1/.test(location.search)) msg('Your batch access has ended');

  // Already signed in? Go straight on.
  fetch('/api/me', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (me) {
    if (me.signedIn && me.role === 'admin') handle({ status: 'admin', name: me.name, email: me.email });
    else if (me.signedIn && me.role === 'student' && !/ended=1/.test(location.search)) location.href = '/lab/';
  }).catch(function () {});

  fetch('/api/config').then(function (r) { return r.json(); }).then(function (c) {
    var s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = function () {
      google.accounts.id.initialize({
        client_id: c.clientId,
        callback: function (resp) { msg('Checking your access…', 'ok'); post('/api/auth/google', { credential: resp.credential }).then(handle); },
      });
      google.accounts.id.renderButton($('gbtn'), { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 340 });
      show('gload', false);
    };
    s.onerror = function () { $('gload').textContent = 'Google sign-in did not load. Check your connection and refresh.'; };
    document.body.appendChild(s);
  });
})();
