(() => {
  'use strict';

  const d = document;
  const root = d.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  root.classList.add('motion-enhanced');

  const serviceData = [
    { n: '01', title: 'Web', copy: 'Sitios, landing pages y plataformas.', image: 'assets/images/office-workspace.webp' },
    { n: '02', title: 'Android', copy: 'Aplicativos orientados a necesidades específicas.', image: 'assets/images/business-workspace.webp' },
    { n: '03', title: 'Sistemas', copy: 'Herramientas para procesos administrativos y operativos.', image: 'assets/images/developer-office.webp' },
    { n: '04', title: 'Excel + VBA', copy: 'Automatización, formularios, paneles y reportes.', image: 'assets/images/code-workspace.webp' },
    { n: '05', title: 'Ofimática', copy: 'Soluciones desde nivel básico hasta avanzado.', image: 'assets/images/business-workspace.webp' }
  ];

  const createCurtain = () => {
    const curtain = d.createElement('div');
    curtain.className = 'motion-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    d.body.prepend(curtain);
    return curtain;
  };

  const buildRibbon = () => {
    const hero = d.querySelector('.hero');
    if (!hero || d.querySelector('.motion-ribbon')) return;
    const ribbon = d.createElement('div');
    ribbon.className = 'motion-ribbon';
    ribbon.setAttribute('aria-hidden', 'true');
    const track = d.createElement('div');
    track.className = 'motion-ribbon-track';
    const labels = ['Web', 'Android', 'Sistemas para pymes', 'Excel + VBA', 'Ofimática'];
    for (let set = 0; set < 4; set += 1) {
      labels.forEach(label => {
        const item = d.createElement('span');
        item.className = 'motion-ribbon-item';
        item.textContent = label;
        track.appendChild(item);
      });
    }
    ribbon.appendChild(track);
    hero.insertAdjacentElement('afterend', ribbon);
    return { ribbon, track };
  };

  const buildDeck = () => {
    const heroMedia = d.querySelector('.hero-media');
    if (!heroMedia || heroMedia.querySelector('.motion-deck')) return;
    const deck = d.createElement('div');
    deck.className = 'motion-deck';
    deck.setAttribute('aria-hidden', 'true');
    serviceData.forEach((item, index) => {
      const card = d.createElement('article');
      card.className = 'motion-card';
      card.style.setProperty('--deck-i', String(index));
      card.style.setProperty('--card-image', `url("${item.image}")`);
      card.innerHTML = `
        <div class="motion-card-copy">
          <div class="motion-card-topline"><span>${item.n}</span><span>Área de trabajo</span></div>
          <strong>${item.title}</strong>
          <small>${item.copy}</small>
        </div>`;
      deck.appendChild(card);
    });
    heroMedia.appendChild(deck);
    return deck;
  };

  const addPointerTilt = (element, strength = 5) => {
    if (!element || !fine || reduced) return;
    element.classList.add('motion-tilt');
    let raf = 0;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    const tick = () => {
      rx += (tx - rx) * .11;
      ry += (ty - ry) * .11;
      element.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      raf = requestAnimationFrame(tick);
    };
    element.addEventListener('pointermove', (event) => {
      const r = element.getBoundingClientRect();
      const px = (event.clientX - r.left) / r.width - .5;
      const py = (event.clientY - r.top) / r.height - .5;
      tx = py * -strength;
      ty = px * strength;
      if (!raf) tick();
    }, { passive: true });
    element.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  };

  const deck = buildDeck();
  const ribbonParts = buildRibbon();
  const curtain = reduced ? null : createCurtain();

  if (!gsap || !ScrollTrigger || reduced) {
    curtain?.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // First-load cinematic wipe. It never blocks content when reduced motion is requested.
  if (curtain) {
    const intro = gsap.timeline({ defaults: { ease: 'power4.inOut' } });
    intro
      .to(curtain, { yPercent: -101, duration: 1.05, delay: .08 })
      .from('.site-header', { y: -22, opacity: 0, duration: .65, ease: 'power3.out' }, '-=.55')
      .from('.hero-topline', { y: 20, opacity: 0, duration: .6, ease: 'power3.out' }, '-=.45');
    intro.eventCallback('onComplete', () => curtain.remove());
  }

  // Hero deck: layered cards similar in spirit to the reference, but using real service categories.
  if (deck) {
    const cards = [...deck.querySelectorAll('.motion-card')];
    const finalTransforms = [
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -34, y: -20, rotation: -5.5, scale: .965 },
      { x: 33, y: -30, rotation: 5.5, scale: .93 },
      { x: -58, y: -47, rotation: -9, scale: .895 },
      { x: 57, y: -58, rotation: 9, scale: .86 }
    ];
    cards.forEach((card, i) => {
      gsap.set(card, { z: -i * 24, transformPerspective: 1200 });
      gsap.fromTo(card,
        { x: 150 + i * 26, y: 85 - i * 6, rotation: 13 + i * 4, scale: .7, opacity: 0 },
        { ...finalTransforms[i], opacity: 1, duration: 1.1, delay: .42 + i * .08, ease: 'power4.out' }
      );
    });

    if (fine) {
      deck.addEventListener('pointermove', (event) => {
        const r = deck.getBoundingClientRect();
        const px = (event.clientX - r.left) / r.width - .5;
        const py = (event.clientY - r.top) / r.height - .5;
        cards.forEach((card, i) => {
          const depth = 1 - i * .12;
          const base = finalTransforms[i];
          gsap.to(card, {
            x: base.x + px * 20 * depth,
            y: base.y + py * 16 * depth,
            rotationX: py * -4 * depth,
            rotationY: px * 5 * depth,
            duration: .55,
            ease: 'power3.out',
            overwrite: true
          });
        });
      }, { passive: true });
      deck.addEventListener('pointerleave', () => {
        cards.forEach((card, i) => gsap.to(card, { ...finalTransforms[i], rotationX: 0, rotationY: 0, duration: .8, ease: 'power3.out' }));
      });
    }

    gsap.to(cards, {
      yPercent: (i) => -7 * (cards.length - i),
      rotation: (i) => finalTransforms[i].rotation * .35,
      stagger: .015,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: .65
      }
    });
  }

  // Continuous ribbon. GSAP owns the transform so it stays smooth.
  if (ribbonParts?.track) {
    const distance = ribbonParts.track.scrollWidth / 4;
    gsap.to(ribbonParts.track, {
      x: -distance,
      duration: 25,
      ease: 'none',
      repeat: -1
    });
  }

  // Editorial section reveals and controlled parallax.
  gsap.utils.toArray('.display-heading, .profile-name, .contact-title').forEach((heading) => {
    gsap.fromTo(heading,
      { y: 46, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: { trigger: heading, start: 'top 86%', once: true }
      }
    );
  });

  gsap.utils.toArray('.service-image img, .capabilities-photo img, .github-image img').forEach((img) => {
    gsap.fromTo(img,
      { scale: 1.08, yPercent: -2 },
      {
        scale: 1.02,
        yPercent: 2,
        ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: .8 }
      }
    );
  });

  gsap.utils.toArray('.process-list li').forEach((row, index) => {
    gsap.from(row, {
      x: index % 2 ? 26 : -26,
      opacity: 0,
      duration: .72,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 90%', once: true }
    });
  });

  gsap.from('.whatsapp-band', {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1.05,
    ease: 'power4.inOut',
    scrollTrigger: { trigger: '.whatsapp-band', start: 'top 87%', once: true }
  });

  addPointerTilt(d.querySelector('.hero-media'), 2.1);
  addPointerTilt(d.querySelector('.service-image-stack'), 3.2);

  // Recalculate after fonts/images settle so pinned and scrubbed positions remain exact.
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
})();
