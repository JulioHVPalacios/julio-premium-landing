(() => {
  'use strict';
  const doc = document;
  const root = doc.documentElement;
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  doc.getElementById('year').textContent = new Date().getFullYear();

  const header = doc.querySelector('[data-header]');
  const progress = doc.querySelector('.page-progress span');
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 28);
    const max = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
    progress.style.transform = `scaleX(${Math.min(1, y / max)})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = doc.querySelector('.menu-toggle');
  const menu = doc.getElementById('mobile-menu');
  const closeMenu = () => {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
    doc.body.style.overflow = '';
  };
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else {
      menu.hidden = false;
      requestAnimationFrame(() => menuBtn.setAttribute('aria-expanded', 'true'));
      doc.body.style.overflow = 'hidden';
    }
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const revealEls = [...doc.querySelectorAll('.reveal,.reveal-text,.reveal-media')];
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-revealed'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: .08 });
    revealEls.forEach(el => io.observe(el));
  }

  const story = doc.querySelector('[data-service-story]');
  const chapters = [...doc.querySelectorAll('[data-service]')];
  const images = [...doc.querySelectorAll('[data-service-image]')];
  const current = doc.querySelector('[data-service-current]');
  if (story && innerWidth > 700 && 'IntersectionObserver' in window) {
    const serviceObserver = new IntersectionObserver(entries => {
      let best = null;
      entries.forEach(entry => {
        if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) best = entry;
      });
      if (!best) return;
      const index = Number(best.target.dataset.service);
      chapters.forEach((el, i) => el.classList.toggle('is-active', i === index));
      images.forEach((el, i) => el.classList.toggle('is-active', i === index));
      if (current) current.textContent = String(index + 1).padStart(2, '0');
    }, { threshold: [.35,.55,.75], rootMargin: '-12% 0px -12% 0px' });
    chapters.forEach(el => serviceObserver.observe(el));
  }

  const spotlight = doc.querySelector('[data-spotlight]');
  if (spotlight && finePointer && !prefersReduced) {
    const colorLayer = spotlight.querySelector('.hero-color');
    let x = 50, y = 50, tx = 50, ty = 50, raf = 0;
    const render = () => {
      x += (tx - x) * .16; y += (ty - y) * .16;
      colorLayer.style.clipPath = `circle(19% at ${x}% ${y}%)`;
      raf = requestAnimationFrame(render);
    };
    spotlight.addEventListener('pointermove', e => {
      const r = spotlight.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
    }, { passive: true });
    spotlight.addEventListener('pointerenter', () => { if (!raf) render(); });
    spotlight.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf); raf = 0; colorLayer.style.clipPath = 'circle(0 at 50% 50%)';
      x = tx = 50; y = ty = 50;
    });
  }

  const cursor = doc.querySelector('.cursor');
  if (cursor && finePointer && !prefersReduced) {
    let cx = innerWidth/2, cy = innerHeight/2, mx = cx, my = cy;
    const tick = () => {
      cx += (mx - cx) * .22; cy += (my - cy) * .22;
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    doc.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-link'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-link'));
    });
    tick();
  }

  if (finePointer && !prefersReduced) {
    doc.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width/2)) * .035;
        const dy = (e.clientY - (r.top + r.height/2)) * .06;
        el.style.transform = `translate(${dx}px,${dy}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  doc.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      const target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = header?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + scrollY - offset + 1;
      scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
