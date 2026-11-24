/* Resume site — interactions */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  const THEME_KEY = 'sz-theme';
  const metaTheme = document.querySelectorAll('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    metaTheme.forEach((m) => {
      m.setAttribute('content', theme === 'dark' ? '#0b0d10' : '#f6f6f4');
    });
    const btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-pressed', String(theme === 'dark'));
  };

  let stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (_) {}
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(stored || (prefersDark ? 'dark' : 'light'));

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  });

  /* ---------- Sticky bar + scroll progress ---------- */
  const topbar = document.getElementById('topbar');
  const progress = document.getElementById('progress');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY || 0;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
    topbar?.classList.toggle('is-stuck', y > 8);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = Array.from(el.parentElement?.children || []).filter((n) => n.classList.contains('reveal'));
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        el.classList.add('is-in');
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const visible = new Map();
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null;
      let bestRatio = 0;
      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) { bestRatio = ratio; best = id; }
      });
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', best !== null && a.getAttribute('href') === '#' + best);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------- Print ---------- */
  const print = () => window.print();
  document.getElementById('printBtn')?.addEventListener('click', print);
  document.getElementById('printBtn2')?.addEventListener('click', print);

  /* ---------- Copy e-mail ---------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  };

  document.getElementById('copyMail')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const label = btn.querySelector('span');
    const mail = btn.dataset.mail || 'stepan.zl@yandex.ru';
    const ok = await copyText(mail);
    if (ok && label) {
      const prev = label.textContent;
      label.textContent = 'Скопировано: ' + mail;
      setTimeout(() => { label.textContent = prev; }, 2200);
      showToast('E-mail скопирован');
    } else {
      showToast('Не удалось скопировать — ' + mail);
    }
  });

  /* ---------- Keyboard: "p" prints ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target instanceof HTMLElement ? e.target.tagName : '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      e.preventDefault();
      print();
    }
  });
})();
