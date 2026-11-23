/* Get Butter: plain site script (no animation libraries, no effects). */
(function () {
  /* menu */
  const menu = document.getElementById('menu');
  const menuBtn = document.getElementById('menuBtn');
  const menuLbl = document.getElementById('menuLbl');
  let open = false;
  function setMenu(o) {
    if (!menu) return;
    open = o;
    document.body.classList.toggle('menu-open', o);
    menu.classList.toggle('open', o);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(o));
    if (menuLbl) menuLbl.textContent = o ? 'Close' : 'Menu';
  }
  function closeMenu() { if (open) setMenu(false); }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(!open));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* form switch (homepage) */
  function showPane(id) {
    const panes = document.querySelectorAll('.fpanes .fcard');
    if (!panes.length) return false;
    let found = false;
    panes.forEach((p) => { const on = p.id === id; if (on) found = true; p.hidden = !on; p.classList.toggle('active', on); });
    if (!found) return false;
    document.querySelectorAll('.ftabs [data-pane]').forEach((b) => {
      const on = b.dataset.pane === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });
    return true;
  }
  document.querySelectorAll('.ftabs [data-pane]').forEach((b) => b.addEventListener('click', () => showPane(b.dataset.pane)));

  /* same-page links: close the menu; links to a form open that form */
  function goTo(hash) {
    let el = document.querySelector(hash);
    if (!el) return false;
    if (el.classList.contains('fcard') && showPane(el.id)) el = document.getElementById('contact') || el;
    if (el.closest && el.closest('.forms2.both') && innerWidth > 900) el = document.querySelector('#contact .ch-head') || el;
    el.scrollIntoView();
    return true;
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const h = a.getAttribute('href');
    if (h.length < 2) return;
    closeMenu();
    if (goTo(h)) e.preventDefault();
  }));
  if (location.hash.length > 1) addEventListener('load', () => goTo(location.hash));

  /* solid header bar once scrolled */
  const setScrolled = () => document.body.classList.toggle('scrolled', (window.scrollY || document.documentElement.scrollTop) > 24);
  addEventListener('scroll', setScrolled, { passive: true });
  setScrolled();

  /* CV / job spec upload boxes */
  document.querySelectorAll('.filedrop').forEach((drop) => {
    const input = document.getElementById(drop.getAttribute('for'));
    if (!input) return;
    const label = drop.querySelector('[data-file-label]');
    const sync = () => { const f = input.files[0]; drop.classList.toggle('has', !!f); if (label) label.textContent = f ? f.name : (label.dataset.default || 'Upload file'); };
    input.addEventListener('change', sync);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });

  /* 30+ counter shows its final number */
  const years = document.getElementById('years');
  if (years) years.textContent = '30';

  /* thank-you page wording */
  const body = document.querySelector('[data-thanks-body]');
  if (body) {
    let type = '', email = '';
    try { type = sessionStorage.getItem('gb_type') || ''; email = sessionStorage.getItem('gb_email') || ''; } catch (_) {}
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const sent = email ? `We'll be in touch at <strong>${esc(email)}</strong>. ` : '';
    const msg = type === 'venue' ? "Thanks for your enquiry. We'll get back to you soon, usually the same day."
      : type === 'talent' ? "You're on our list for roles that fit you."
      : type === 'contact' ? "Thanks for your message. We'll get back to you shortly."
      : "We'll be in touch soon.";
    body.innerHTML = sent + msg;
  }
})();
