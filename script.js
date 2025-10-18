const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

function updateThemeColorMeta(){
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0B0B0C';
  meta.setAttribute('content', bg);
}

class ThemeToggle {
  constructor(btn){
    this.btn = btn; this.root = document.documentElement;
    this.state = this.root.getAttribute('data-theme') || 'dark';
    this.apply(this.state);
    btn.addEventListener('click', () => this.toggle());
  }
  toggle(){ this.apply(this.state === 'dark' ? 'light' : 'dark'); }
  apply(next){
    this.state = next; this.root.setAttribute('data-theme', next);
    try{ localStorage.setItem('sc-theme', next); }catch(_){ }
    this.btn.setAttribute('aria-pressed', String(next === 'light'));
    this.root.dispatchEvent(new CustomEvent('sc-theme-change', { detail: { theme: next } }));
  }
}

class NavBar {
  constructor(){
    this.menuBtn = $('#menuToggle');
    this.mobile = $('#mobileMenu');
    this.links = [...this.mobile.querySelectorAll('a')];
    this.menuBtn.addEventListener('click', () => this.toggle());
    this.links.forEach(a => a.addEventListener('click', () => this.close()));
  }
  toggle(){
    const open = document.body.classList.toggle('mobile-open');
    this.menuBtn.setAttribute('aria-expanded', String(open));
  }
  close(){ document.body.classList.remove('mobile-open'); this.menuBtn.setAttribute('aria-expanded','false'); }
}

class RevealOnScroll {
  constructor(){
    this.els = [...$$('.reveal')];
    this.io = new IntersectionObserver(this.on.bind(this), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.els.forEach(el => this.io.observe(el));
  }
  on(entries){ entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('is-visible'); this.io.unobserve(e.target); } }); }
}

class Toast {
  constructor(){ this.root = $('#toast'); }
  show(text, type='success', timeout=2800){
    const item = document.createElement('div');
    item.className = `item ${type}`; item.textContent = text;
    this.root.appendChild(item);
    requestAnimationFrame(() => item.classList.add('show'));
    setTimeout(() => { item.classList.remove('show'); setTimeout(() => item.remove(), 220); }, timeout);
  }
}

class ProductFilter {
  constructor(){
    this.chips = [...document.querySelectorAll('.filters .chip')];
    this.cards = [...document.querySelectorAll('.product-card')];
    this.active = new Set(['all']);
    this.chips.forEach(ch => ch.addEventListener('click', () => this.toggle(ch)));
    this.update();
  }
  toggle(ch){
    const tag = ch.dataset.tag;
    if (tag === 'all'){
      this.active.clear(); this.active.add('all');
      this.chips.forEach(c => c.classList.toggle('active', c.dataset.tag === 'all'));
    } else {
      this.active.delete('all');
      ch.classList.toggle('active');
      if (ch.classList.contains('active')) this.active.add(tag); else this.active.delete(tag);
      if (this.active.size === 0){
        this.active.add('all'); this.chips.find(c => c.dataset.tag === 'all')?.classList.add('active');
      } else { this.chips.find(c => c.dataset.tag === 'all')?.classList.remove('active'); }
    }
    this.update();
  }
  update(){
    const all = this.active.has('all');
    this.cards.forEach(card => {
      const tags = (card.dataset.tags||'').split(',').map(s=>s.trim());
      const show = all || tags.some(t => this.active.has(t));
      card.style.display = show ? 'grid' : 'none';
    });
  }
}

class DetailsModal {
  constructor(){
    this.root = $('#detailsModal');
    this.title = this.root.querySelector('.modal-title');
    this.text = this.root.querySelector('.modal-text');
    this.image = this.root.querySelector('.modal-image');
    this.closeBtn = this.root.querySelector('.modal-close');
    this.prevFocus = null;
    this.closeBtn.addEventListener('click', () => this.close());
    this.root.addEventListener('click', e => { if (e.target === this.root) this.close(); });
    document.addEventListener('keydown', e => { if (this.isOpen() && e.key === 'Escape') this.close(); });
    [...document.querySelectorAll('.details-btn')].forEach(b => b.addEventListener('click', e => this.openFrom(e.currentTarget)));
  }
  isOpen(){ return this.root.getAttribute('aria-hidden') === 'false'; }
  openFrom(btn){
    const card = btn.closest('.product-card');
    if (!card) return;
    this.title.textContent = card.dataset.title || '';
    this.text.textContent = card.dataset.desc || '';
    const img = card.querySelector('.product-media img');
    if (img && img.src) {
      this.image.style.background = `url('${img.src}') center/cover no-repeat, var(--card-bg)`;
    } else {
      this.image.style.background = 'var(--card-bg)';
    }
    this.open();
  }
  open(){ this.prevFocus = document.activeElement; this.root.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); this.closeBtn.focus(); }
  close(){ this.root.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); this.prevFocus?.focus(); }
}

class Lightbox {
  constructor(){
    this.root = $('#lightbox');
    this.img = this.root.querySelector('.lightbox-img');
    this.closeBtn = this.root.querySelector('.lightbox-close');
    this.prevBtn = this.root.querySelector('.lightbox-prev');
    this.nextBtn = this.root.querySelector('.lightbox-next');
    this.items = [...document.querySelectorAll('[data-lightbox] img')];
    this.index = 0; this.prevFocus = null;
    this.items.forEach((img, i) => img.addEventListener('click', () => this.open(i)));
    this.root.addEventListener('click', e => { if (e.target === this.root) this.close(); });
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', () => this.nav(-1));
    this.nextBtn.addEventListener('click', () => this.nav(1));
    document.addEventListener('keydown', e => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.nav(-1);
      if (e.key === 'ArrowRight') this.nav(1);
    });
  }
  isOpen(){ return this.root.getAttribute('aria-hidden') === 'false'; }
  open(i){ this.prevFocus = document.activeElement; this.index = i; this.show(); this.root.setAttribute('aria-hidden','false'); document.body.classList.add('no-scroll'); this.closeBtn.focus(); }
  close(){ this.root.setAttribute('aria-hidden','true'); document.body.classList.remove('no-scroll'); this.prevFocus?.focus(); }
  nav(dir){ this.index = (this.index + dir + this.items.length) % this.items.length; this.show(); }
  show(){ const src = this.items[this.index].src; const alt = this.items[this.index].alt || 'Image'; this.img.src = src; this.img.alt = alt; }
}

class CounterOnView {
  constructor(){
    this.counters = [...document.querySelectorAll('.counter[data-target]')];
    this.io = new IntersectionObserver(this.on.bind(this), { threshold: 0.6 });
    this.counters.forEach(el => this.io.observe(el));
  }
  on(entries){ entries.forEach(e => { if (e.isIntersecting){ this.animate(e.target); this.io.unobserve(e.target); } }); }
  animate(el){
    const target = parseFloat(el.dataset.target||'0');
    const suffix = el.dataset.suffix || '';
    const start = 0; const dur = 1200; const t0 = performance.now();
    const step = (t)=>{
      const p = Math.min(1, (t - t0)/dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(start + (target - start) * eased);
      el.textContent = `${val}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

class CanvasParticles {
  constructor(canvas){
    this.c = canvas.getContext('2d'); this.cv = canvas; this.ratio = Math.min(2, window.devicePixelRatio||1);
    this.particles = []; this.running = false; this.raf = 0;
    this.color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3BA9FF';
    this.resize = this.resize.bind(this); this.loop = this.loop.bind(this); this.onTheme = this.onTheme.bind(this);
    window.addEventListener('resize', this.throttle(() => { this.resize(); this.spawn(); }, 150));
    document.documentElement.addEventListener('sc-theme-change', this.onTheme);
    this.mql = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (this.mql) this.mql.addEventListener('change', e => { if (e.matches) { this.stop(); this.drawStatic(); } else { this.start(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.stop(); } else { if (this.mql && this.mql.matches) { this.drawStatic(); } else { this.start(); } }});
    this.resize(); this.spawn();
    if (this.mql && this.mql.matches) { this.drawStatic(); } else { this.start(); }
  }
  throttle(fn, ms){ let t=0; return (...a)=>{ const n=Date.now(); if (n-t>ms){ t=n; fn(...a);} }; }
  onTheme(){ this.color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3BA9FF'; }
  resize(){ const w = this.cv.clientWidth, h = this.cv.clientHeight; this.cv.width = Math.floor(w*this.ratio); this.cv.height = Math.floor(h*this.ratio); this.c.setTransform(1,0,0,1,0,0); this.c.scale(this.ratio, this.ratio); }
  spawn(){
    const area = this.cv.clientWidth * this.cv.clientHeight;
    const count = Math.floor(area / 30000) + 18;
    this.particles = new Array(count).fill(0).map(()=>({
      x: Math.random()*this.cv.clientWidth,
      y: Math.random()*this.cv.clientHeight,
      vx: (Math.random()-0.5)*0.25,
      vy: (Math.random()-0.5)*0.25,
      r: Math.random()*1.6 + 0.6,
      a: Math.random()*0.35 + 0.15
    }));
  }
  start(){ if (this.running) return; this.running = true; this.raf = requestAnimationFrame(this.loop); }
  stop(){ this.running = false; if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  loop(){ if (!this.running) return; this.draw(); this.raf = requestAnimationFrame(this.loop); }
  draw(){
    const ctx=this.c, w=this.cv.clientWidth, h=this.cv.clientHeight; ctx.clearRect(0,0,w,h);
    ctx.fillStyle=this.color; for(const p of this.particles){
      p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1;
      ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  drawStatic(){
    const ctx=this.c, w=this.cv.clientWidth, h=this.cv.clientHeight; ctx.clearRect(0,0,w,h);
    ctx.fillStyle=this.color; for(const p of this.particles){ ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
  }
}

function formValidation(toast){
  const f = $('#contactForm'); if (!f) return;
  const name = $('#name'), email = $('#email'), message = $('#message');
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const setErr = (el, on)=>{ el.classList.toggle('error', on); };
  f.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    setErr(name, name.value.trim().length < 2); ok = ok && name.value.trim().length >= 2;
    setErr(email, !isEmail(email.value.trim())); ok = ok && isEmail(email.value.trim());
    setErr(message, message.value.trim().length < 10); ok = ok && message.value.trim().length >= 10;
    if (!ok){ toast.show('Please check the form fields', 'error'); return; }
    const btn = f.querySelector('button[type="submit"]'); const prev = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
    setTimeout(()=>{ btn.disabled=false; btn.textContent=prev; f.reset(); toast.show('Message sent', 'success'); }, 700);
  });
}

function initYear(){ const y=$('#year'); if (y) y.textContent = new Date().getFullYear(); }

ready(() => {
  new ThemeToggle($('#themeToggle'));
  updateThemeColorMeta();
  document.documentElement.addEventListener('sc-theme-change', updateThemeColorMeta);
  new NavBar();
  new RevealOnScroll();
  const toast = new Toast();
  new ProductFilter();
  new DetailsModal();
  new Lightbox();
  new CounterOnView();
  initYear();
  formValidation(toast);
  const canvas = $('#bg-canvas');
  if (canvas){
    const start = () => new CanvasParticles(canvas);
    window.addEventListener('load', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(start, { timeout: 2000 });
      } else {
        setTimeout(start, 600);
      }
    });
  }
});
