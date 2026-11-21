(function(){
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = matchMedia('(hover: none)').matches;
const hasGsap = !!window.gsap;
if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
const goTo = (hash) => { let el = document.querySelector(hash); if (!el) return; if (el.classList.contains('fcard')) { showPane(el.id); el = document.getElementById('contact') || el; } lenis ? lenis.scrollTo(el, { offset: -20, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }); };
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const h = a.getAttribute('href'); if (h.length < 2) return; e.preventDefault(); closeMenu(); goTo(h); }));
if (location.hash.length > 1) addEventListener('load', () => setTimeout(() => goTo(location.hash), 300));

/* ---------- split headings into words ---------- */
document.querySelectorAll('.split').forEach(h => {
  h.innerHTML = h.textContent.trim().split(' ').map(w => {
    const dot = w.endsWith('.') ? '<span class="y">.</span>' : '';
    return `<span class="w"><span>${dot ? w.slice(0, -1) : w}${dot}</span></span>`;
  }).join(' ');
});

/* ---------- neural network background ---------- */
let mouse = { x: -9999, y: -9999 }, mat = null;
const net = document.getElementById('net'), ctx = net.getContext('2d');
let W, H, DPR, pts = [];
function sizeNet(){
  DPR = Math.min(devicePixelRatio || 1, touch ? 1.5 : 2);
  W = net.width = innerWidth * DPR; H = net.height = innerHeight * DPR;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 || (navigator.connection && navigator.connection.saveData);
  const cap = lowPower ? (touch ? 32 : 70) : (touch ? 55 : 120);
  const n = Math.round(Math.min(cap, (innerWidth * innerHeight) / (touch ? 9000 : 11000)));
  pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3 * DPR, vy: (Math.random() - .5) * .3 * DPR, r: (Math.random() * 1.2 + 1) * DPR }));
}
addEventListener('resize', sizeNet); sizeNet();
addEventListener('pointermove', e => { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; });
document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
let boost = 0;
function frame(){
  const sc = lenis ? lenis.scroll : scrollY;
  const vel = lenis ? Math.abs(lenis.velocity || 0) : 0;
  boost += (Math.min(1, vel / 40) - boost) * 0.08;
  const L = (150 + boost * 60) * DPR, R = 190 * DPR;
  ctx.clearRect(0, 0, W, H);
  const drift = sc * 0.15 * DPR;
  for (const p of pts) {
    if (!reduce) { p.x += p.vx * (1 + boost * 3); p.y += p.vy * (1 + boost * 3); }
    if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
    const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
    if (d < R && d > 0) { p.x += dx / d * 0.9; p.y += dy / d * 0.9; }
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < L) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, md = Math.hypot(mx - mouse.x, my - mouse.y);
        const near = md < R * 1.6 ? 1 - md / (R * 1.6) : 0;
        ctx.strokeStyle = isLight() ? `rgba(176,122,0,${Math.min(1,(1 - d / L) * (0.38 + near * 0.6 + boost * 0.2))})` : `rgba(255,196,0,${(1 - d / L) * (0.22 + near * 0.6 + boost * 0.2)})`;
        ctx.lineWidth = DPR * (0.7 + near * 0.6);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  for (const p of pts) {
    const md = Math.hypot(p.x - mouse.x, p.y - mouse.y), near = md < R ? 1 - md / R : 0;
    ctx.fillStyle = isLight() ? `rgba(${170 + near * 30},${116 + near * 30},0,${0.8 + near * 0.2})` : `rgba(255,${200 + near * 40},${80 + near * 100},${0.75 + near * 0.25})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r + near * 1.5 * DPR, 0, 7); ctx.fill();
  }
  if (!reduce && !document.hidden) requestAnimationFrame(frame); else running = false;
}
let running = true;
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce && !running) { running = true; requestAnimationFrame(frame); } });

/* ---------- cursor ---------- */
if (!touch && !reduce) {
  document.body.classList.add('has-cursor');
  const dot = document.getElementById('cursor'), ring = document.getElementById('cursor-ring');
  let rx = innerWidth / 2, ry = innerHeight / 2, mx = rx, my = ry;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop(){ rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.querySelectorAll('a,button,input,select').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('big'); ring.classList.toggle('dark', el.matches('.pbtn.solid, .gbtn, #menu a')); });
    el.addEventListener('mouseleave', () => ring.classList.remove('big', 'dark'));
  });
} else { document.getElementById('cursor').remove(); document.getElementById('cursor-ring').remove(); }

/* ---------- menu ---------- */
const menu = document.getElementById('menu'), menuBtn = document.getElementById('menuBtn'), menuLbl = document.getElementById('menuLbl');
let open = false;
function setMenu(o){
  open = o; document.body.classList.toggle('menu-open', o); menu.classList.toggle('open', o);
  menuBtn.setAttribute('aria-expanded', String(o)); menuLbl.textContent = o ? 'Close' : 'Menu';
  if (lenis) o ? lenis.stop() : lenis.start();
  if (hasGsap && !reduce) {
    gsap.to(menu, { clipPath: o ? 'circle(150% at calc(100% - 60px) 40px)' : 'circle(0% at calc(100% - 60px) 40px)', duration: o ? 0.9 : 0.6, ease: o ? 'power3.inOut' : 'power3.in' });
    if (o) gsap.fromTo('#menu li a', { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out', delay: 0.25 });
  } else menu.style.clipPath = o ? 'none' : 'circle(0% at calc(100% - 60px) 40px)';
}
function closeMenu(){ if (open) setMenu(false); }
menuBtn.addEventListener('click', () => setMenu(!open));
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

/* ---------- loader + intro + scroll animations ---------- */
const countEl = document.getElementById('count'), bar = document.getElementById('bar'), loader = document.getElementById('loader');
function intro(){
  if (!hasGsap || reduce) { if (loader) loader.remove(); return; }
  if (!document.querySelector('.hero h1 .line > span')) { if (loader) loader.remove(); return; }
  gsap.set('.hero h1 .line > span', { yPercent: 110 });
  gsap.set('[data-fade]', { autoAlpha: 0, y: 20 });
  const tl = gsap.timeline();
  if (loader) tl.to(loader, { yPercent: -100, duration: 1.1, ease: 'power4.inOut', onComplete: () => loader.remove() });
  tl.to('.hero h1 .line > span', { yPercent: 0, duration: 1.3, stagger: 0.12, ease: 'power4.out' }, loader ? '-=0.45' : 0.1)
    .to('[data-fade]', { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=0.9')
    .from('#net', { opacity: 0, duration: 2, ease: 'power2.out' }, '-=1.6');
}
if (hasGsap && !reduce && loader) {
  const c = { v: 0 };
  gsap.to(c, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = String(Math.round(c.v)).padStart(3, '0'); bar.style.transform = `scaleX(${c.v / 100})`; }, onComplete: intro });
} else intro();

if (hasGsap && window.ScrollTrigger && !reduce) {
  document.querySelectorAll('.split').forEach(h => {
    gsap.from(h.querySelectorAll('.w > span'), { yPercent: 110, duration: 1.1, stagger: 0.07, ease: 'power4.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  gsap.utils.toArray('.gcard').forEach((a, i) => gsap.from(a, { autoAlpha: 0, filter: 'blur(12px)', duration: 1.1, delay: (i % 2) * 0.12, ease: 'power3.out', clearProps: 'filter', scrollTrigger: { trigger: a, start: 'top 92%' } }));
  gsap.utils.toArray('[data-rise]').forEach(el => gsap.from(el, { autoAlpha: 0, y: 60, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  if (document.getElementById('years')) { const yrs = { v: 0 };
  gsap.to(yrs, { v: 30, duration: 2, ease: 'power3.out', onUpdate: () => document.getElementById('years').textContent = Math.round(yrs.v), scrollTrigger: { trigger: '#years', start: 'top 85%' } }); }
  if (document.getElementById('track')) gsap.to('#track', { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 } });

} else { const y = document.getElementById('years'); if (y) y.textContent = '30'; }
})();
/* thanks page: wording for the full site */
(function(){
  const body = document.querySelector('[data-thanks-body]'); if (!body) return;
  let type = '', email = '';
  try { type = sessionStorage.getItem('gb_type') || ''; email = sessionStorage.getItem('gb_email') || ''; } catch (_) {}
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sent = email ? `We'll be in touch at <strong>${esc(email)}</strong>. ` : '';
  const msg = type === 'venue' ? "Thanks for your enquiry. We'll get back to you soon, usually the same day."
    : type === 'talent' ? "You're on our list for roles that fit you."
    : type === 'contact' ? "Thanks for your message. We'll get back to you shortly."
    : "We'll be in touch soon.";
  body.innerHTML = sent + msg;
})();

/* CV drop zones */
document.querySelectorAll('.filedrop').forEach(drop => {
  const input = document.getElementById(drop.getAttribute('for')); if (!input) return;
  const label = drop.querySelector('[data-file-label]');
  const sync = () => { const f = input.files[0]; drop.classList.toggle('has', !!f); if (label) label.textContent = f ? f.name : 'Upload your CV'; };
  input.addEventListener('change', sync);
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => { if (e.dataTransfer && e.dataTransfer.files.length) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); } });
});

/* form switch */
function showPane(id){
  const panes = document.querySelectorAll('.fpanes .fcard'); if (!panes.length) return;
  panes.forEach(p => { const on = p.id === id; p.hidden = !on; p.classList.toggle('active', on); });
  document.querySelectorAll('.ftabs [data-pane]').forEach(b => { const on = b.dataset.pane === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}
document.querySelectorAll('.ftabs [data-pane]').forEach(b => b.addEventListener('click', () => showPane(b.dataset.pane)));

/* light / dark switch */
function isLight(){ return document.documentElement.dataset.theme === 'light'; }
(function(){
  const btn = document.getElementById('themeBtn'); if (!btn) return;
  const sync = () => { const l = isLight(); btn.setAttribute('aria-label', l ? 'Switch to dark mode' : 'Switch to light mode'); btn.title = l ? 'Dark mode' : 'Light mode'; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = l ? '#f5f1e6' : '#050505'; };
  btn.addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('gb_theme', next); } catch (_) {}
    sync();
  });
  sync();
})();
