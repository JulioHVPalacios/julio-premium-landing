(() => {
  'use strict';

  const qs = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  const curtain = qs('.intro-curtain');
  const progress = qs('.progress i');
  const nav = qs('[data-nav]');
  const menuBtn = qs('.mobile-menu-btn');
  const mobileNav = qs('#mobile-nav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
      mobileNav.classList.toggle('is-open', !open);
      document.body.style.overflow = !open ? 'hidden' : '';
    });
    qsa('a', mobileNav).forEach(a => a.addEventListener('click', () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
  }

  let lastY = 0;
  const onScrollBase = () => {
    const y = scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    if (progress) progress.style.transform = `scaleY(${Math.min(1, y / max)})`;
    if (nav && y > 160) nav.classList.toggle('is-hidden', y > lastY && y - lastY > 2);
    else nav?.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScrollBase, { passive: true });
  onScrollBase();

  if (fine) {
    const cursor = qs('.cursor');
    if (cursor) {
      let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
      addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
      const tick = () => {
        cx += (mx - cx) * .18; cy += (my - cy) * .18;
        cursor.style.left = `${cx}px`; cursor.style.top = `${cy}px`;
        requestAnimationFrame(tick);
      };
      tick();
      qsa('[data-cursor], a, button').forEach(el => {
        el.addEventListener('pointerenter', () => {
          const label = el.getAttribute('data-cursor');
          qs('span', cursor).textContent = label || '↗';
          cursor.classList.add('is-active');
        });
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
      });
    }

    qsa('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .12;
        const y = (e.clientY - r.top - r.height / 2) * .12;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // --- Immersive Volumetric Smoke Background ---
  const smokeCanvas = qs('#smoke-canvas');
  if (smokeCanvas) {
    const ctx = smokeCanvas.getContext('2d');
    let width = (smokeCanvas.width = smokeCanvas.offsetWidth || window.innerWidth);
    let height = (smokeCanvas.height = smokeCanvas.offsetHeight || window.innerHeight);

    const onResizeSmoke = () => {
      if (!smokeCanvas) return;
      width = smokeCanvas.width = smokeCanvas.offsetWidth || window.innerWidth;
      height = smokeCanvas.height = smokeCanvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResizeSmoke, { passive: true });

    // Generate soft multi-stop smoke textures on offscreen canvas for extreme performance
    const makePuffTexture = (size, r, g, b, alpha) => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const cctx = c.getContext('2d');
      const rad = size / 2;
      const grad = cctx.createRadialGradient(rad, rad, 0, rad, rad, rad);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(0.25, `rgba(${r},${g},${b},${alpha * 0.75})`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},${alpha * 0.3})`);
      grad.addColorStop(0.8, `rgba(${r},${g},${b},${alpha * 0.08})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      cctx.fillStyle = grad;
      cctx.beginPath();
      cctx.arc(rad, rad, rad, 0, Math.PI * 2);
      cctx.fill();
      return c;
    };

    const puffA = makePuffTexture(480, 235, 230, 225, 0.48);
    const puffB = makePuffTexture(560, 210, 205, 200, 0.42);
    const puffC = makePuffTexture(420, 250, 245, 240, 0.38);
    const puffWarm = makePuffTexture(380, 235, 130, 95, 0.28);
    const textures = [puffA, puffB, puffC, puffWarm];

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let curParallaxX = 0;
    let curParallaxY = 0;

    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      targetParallaxX = (e.clientX / window.innerWidth - 0.5) * 45;
      targetParallaxY = (e.clientY / window.innerHeight - 0.5) * 35;
    }, { passive: true });

    class SmokeParticle {
      constructor(init = false) {
        this.reset(init);
      }
      reset(init = false) {
        this.tex = textures[Math.floor(Math.random() * textures.length)];
        this.depth = 0.35 + Math.random() * 0.65; // 3D depth layer
        this.size = (260 + Math.random() * 380) * this.depth;
        this.baseX = Math.random() * (width + 400) - 200;
        this.baseY = init ? Math.random() * (height + 250) - 100 : height + this.size * 0.5;
        this.x = this.baseX;
        this.y = this.baseY;
        this.vx = (Math.random() - 0.5) * 0.45 * this.depth;
        this.vy = -(0.28 + Math.random() * 0.65) * this.depth;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.0035;
        this.life = init ? Math.random() * 1.0 : 0;
        this.maxLife = 1.0;
        this.fadeSpeed = 0.0010 + Math.random() * 0.0013;
        this.swirlSeed = Math.random() * 100;
      }
      update() {
        this.life += this.fadeSpeed;
        if (this.life >= this.maxLife || this.y < -this.size) {
          this.reset(false);
        }
        this.rotation += this.vRot;
        this.swirlSeed += 0.012;
        
        const waveX = Math.sin(this.swirlSeed) * 0.65;
        this.baseX += this.vx + waveX;
        this.baseY += this.vy;

        const dx = (this.baseX - mouseX);
        const dy = (this.baseY - mouseY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 320) {
          const force = (1 - dist / 320) * 1.8 * this.depth;
          this.baseX += (dx / dist) * force * 3.5;
          this.baseY += (dy / dist) * force * 2.5;
        }

        this.x = this.baseX + curParallaxX * this.depth;
        this.y = this.baseY + curParallaxY * this.depth;
      }
      draw() {
        const alpha = Math.sin(this.life * Math.PI);
        if (alpha <= 0.01) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = alpha * (0.65 + this.depth * 0.35);
        ctx.drawImage(this.tex, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    const particles = Array.from({ length: 65 }, () => new SmokeParticle(true));

    let isHeroVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isHeroVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(smokeCanvas);

    const renderSmoke = () => {
      requestAnimationFrame(renderSmoke);
      if (!isHeroVisible) return;

      curParallaxX += (targetParallaxX - curParallaxX) * 0.05;
      curParallaxY += (targetParallaxY - curParallaxY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
    };
    requestAnimationFrame(renderSmoke);
  }

  // --- 3D Cylindrical Carousel Engine ---
  const cylinderStage = qs('[data-deck]');
  const rotor = qs('[data-cylinder-rotor]');
  
  let rotation = 0;
  let isDragging = false;
  let startX = 0;
  let lastX = 0;
  let lastTime = performance.now();
  let dragVelocity = 0;
  let lastFrameTime = performance.now();

  const animateCylinder = (currentTime) => {
    const deltaSeconds = Math.min(0.1, (currentTime - lastFrameTime) / 1000);
    lastFrameTime = currentTime;

    if (!isDragging) {
      if (Math.abs(dragVelocity) > 0.05) {
        rotation += dragVelocity;
        dragVelocity *= 0.94; // inertia decay
      }
      // Subtract rotation constantly (approx 18 deg/sec for smooth continuous loop)
      rotation -= 18 * deltaSeconds;
    }

    if (rotor) {
      rotor.style.transform = `rotateY(${rotation}deg)`;
    }

    requestAnimationFrame(animateCylinder);
  };

  requestAnimationFrame(animateCylinder);

  if (cylinderStage) {
    cylinderStage.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX;
      lastX = e.clientX;
      lastTime = performance.now();
      dragVelocity = 0;
      cylinderStage.style.cursor = 'grabbing';
      if (cylinderStage.setPointerCapture) {
        cylinderStage.setPointerCapture(e.pointerId);
      }
    });

    cylinderStage.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const deltaX = e.clientX - lastX;

      // Add delta.x directly to rotation
      rotation += deltaX * 0.45;
      dragVelocity = (deltaX / dt) * 7.5;

      lastX = e.clientX;
      lastTime = now;
    });

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      cylinderStage.style.cursor = 'grab';
      if (cylinderStage.releasePointerCapture && e.pointerId) {
        try { cylinderStage.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    cylinderStage.addEventListener('pointerup', onPointerUp);
    cylinderStage.addEventListener('pointercancel', onPointerUp);
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    curtain?.remove();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // --- Physical Luxury 3D Fleur-de-Lis Motion Engine ---
  const emblemCard = qs('[data-emblem-card]');
  const emblemShadow = qs('[data-emblem-shadow]');
  let emblemRunning = true;

  if (emblemCard) {
    let t = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let curTiltX = 0;
    let curTiltY = 0;

    const onPointerMoveIntro = (e) => {
      targetTiltX = (e.clientX / window.innerWidth - 0.5) * 22;
      targetTiltY = (e.clientY / window.innerHeight - 0.5) * -18;
    };
    window.addEventListener('pointermove', onPointerMoveIntro, { passive: true });

    const animateEmblem = () => {
      if (!emblemRunning) {
        window.removeEventListener('pointermove', onPointerMoveIntro);
        return;
      }
      requestAnimationFrame(animateEmblem);

      t += 0.032;

      curTiltX += (targetTiltX - curTiltX) * 0.08;
      curTiltY += (targetTiltY - curTiltY) * 0.08;

      const autoTiltY = Math.sin(t * 1.4) * 12;
      const autoTiltX = Math.cos(t * 1.1) * 8;
      const floatY = Math.sin(t * 1.8) * 9;
      const scaleBreath = 1 + Math.sin(t * 1.8) * 0.02;

      const rotY = autoTiltY + curTiltX;
      const rotX = autoTiltX + curTiltY;

      emblemCard.style.transform = `perspective(1000px) translateY(${floatY}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scaleBreath})`;

      if (emblemShadow) {
        const shadowScale = 1 - (floatY / 40);
        const shadowOpacity = 0.7 - (floatY / 60);
        emblemShadow.style.transform = `scale(${shadowScale})`;
        emblemShadow.style.opacity = `${Math.max(0.2, shadowOpacity)}`;
      }
    };
    requestAnimationFrame(animateEmblem);
  }

  // --- Cinematic Aperture Entrance Sequence ---
  const curtainEl = qs('#intro-curtain');
  const curtainTop = qs('.curtain-top');
  const curtainBottom = qs('.curtain-bottom');
  const curtainContent = qs('.curtain-content');
  const curtainNum = qs('.curtain-num');
  const curtainFill = qs('.curtain-fill');

  const introTL = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      emblemRunning = false;
      curtainEl?.remove();
    }
  });

  const counterObj = { val: 0 };

  // --- Headline Word Reveal ---
  const headline = qs('#headline');
  if (headline) {
    const text = "Desarrollo soluciones digitales, aplicaciones y software que transforman empresas.";
    const words = text.split(' ');
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word-reveal';
      span.textContent = word;
      span.style.animationDelay = (0.85 + i * 0.04) + 's';
      headline.appendChild(span);
    });
  }

  // --- Burger Menu & Panel ---
  const burgerBtn = qs('#burger-btn');
  const menuPanel = qs('#menu-panel');
  let menuOpen = false;
  if (burgerBtn && menuPanel) {
    burgerBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      burgerBtn.classList.toggle('open', menuOpen);
      menuPanel.classList.toggle('open', menuOpen);
      burgerBtn.setAttribute('aria-label', menuOpen ? 'Cerrar menú' : 'Abrir menú');
    });
    qsa('nav a, .menu-socials a, .menu-cta-btn', menuPanel).forEach(a => {
      a.addEventListener('click', () => {
        menuOpen = false;
        burgerBtn.classList.remove('open');
        menuPanel.classList.remove('open');
      });
    });
  }

  // --- Interactive Spotlight Image Reveal Engine ---
  const SPOTLIGHT_R = 250;
  const showcaseSec = qs('#showcase');
  const revealCanvas = qs('#reveal-canvas');
  const revealImg = qs('#reveal-img');

  if (showcaseSec && revealCanvas && revealImg) {
    const rctx = revealCanvas.getContext('2d');
    const resizeRevealCanvas = () => {
      revealCanvas.width = showcaseSec.offsetWidth || window.innerWidth;
      revealCanvas.height = showcaseSec.offsetHeight || window.innerHeight;
    };
    resizeRevealCanvas();
    window.addEventListener('resize', resizeRevealCanvas, { passive: true });

    let rmouse = { x: (showcaseSec.offsetWidth || window.innerWidth) * 0.5, y: (showcaseSec.offsetHeight || 600) * 0.5 };
    let rsmooth = { x: (showcaseSec.offsetWidth || window.innerWidth) * 0.5, y: (showcaseSec.offsetHeight || 600) * 0.5 };

    showcaseSec.addEventListener('mousemove', (e) => {
      const rect = showcaseSec.getBoundingClientRect();
      rmouse.x = e.clientX - rect.left;
      rmouse.y = e.clientY - rect.top;
    }, { passive: true });

    const loopSpotlight = () => {
      rsmooth.x += (rmouse.x - rsmooth.x) * 0.1;
      rsmooth.y += (rmouse.y - rsmooth.y) * 0.1;

      rctx.clearRect(0, 0, revealCanvas.width, revealCanvas.height);

      const grad = rctx.createRadialGradient(rsmooth.x, rsmooth.y, 0, rsmooth.x, rsmooth.y, SPOTLIGHT_R);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,1)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
      grad.addColorStop(0.75, 'rgba(255,255,255,0.4)');
      grad.addColorStop(0.88, 'rgba(255,255,255,0.12)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');

      rctx.beginPath();
      rctx.arc(rsmooth.x, rsmooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
      rctx.fillStyle = grad;
      rctx.fill();

      const dataUrl = revealCanvas.toDataURL();
      revealImg.style.webkitMaskImage = 'url(' + dataUrl + ')';
      revealImg.style.maskImage = 'url(' + dataUrl + ')';
      revealImg.style.webkitMaskSize = '100% 100%';
      revealImg.style.maskSize = '100% 100%';

      requestAnimationFrame(loopSpotlight);
    };
    requestAnimationFrame(loopSpotlight);
  }

  // --- Showcase High-Fidelity 3D Cinematic Motion Player & 3D Parallax ---
  const voxelPlayer = qs('#showcase-voxel-player');
  const layerOpen = qs('#motion-layer-open');
  const layerType = qs('#motion-layer-type');

  if (voxelPlayer && layerOpen && layerType) {
    let animPhase = 0; // 0: Open, 1: Type
    const runMotionLoop = () => {
      if (animPhase === 0) {
        // Phase 1: Open laptop
        layerType.classList.remove('is-active');
        layerOpen.classList.add('is-active');
        setTimeout(() => {
          animPhase = 1;
          runMotionLoop();
        }, 2500);
      } else {
        // Phase 2: High-speed realistic typing with screen glow & micro-vibrations
        layerOpen.classList.remove('is-active');
        layerType.classList.add('is-active');
        setTimeout(() => {
          animPhase = 0;
          runMotionLoop();
        }, 5500);
      }
    };
    runMotionLoop();

    // 3D Parallax Tilt with Cursor
    showcaseSec?.addEventListener('mousemove', (e) => {
      const rect = showcaseSec.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      voxelPlayer.style.transform = `perspective(1200px) rotateY(${nx * 14}deg) rotateX(${-ny * 8}deg)`;
    }, { passive: true });

    showcaseSec?.addEventListener('mouseleave', () => {
      voxelPlayer.style.transform = `perspective(1200px) rotateY(0deg) rotateX(0deg)`;
    });
  }

  // --- Intro Timeline Reveal ---
  introTL
    // 1. Counter & progress fill
    .to(counterObj, {
      val: 100,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        const n = Math.floor(counterObj.val);
        if (curtainNum) curtainNum.textContent = `${n < 10 ? '0' + n : n}%`;
        if (curtainFill) curtainFill.style.width = `${counterObj.val}%`;
      }
    })
    // 2. Fade out curtain content with blur
    .to(curtainContent, {
      scale: 0.88,
      opacity: 0,
      filter: 'blur(12px)',
      duration: 0.4,
      ease: 'power2.in'
    }, '-=0.15')
    // 3. Split aperture shutter open
    .to(curtainTop, {
      yPercent: -101,
      duration: 1.0,
      ease: 'expo.inOut'
    }, '-=0.05')
    .to(curtainBottom, {
      yPercent: 101,
      duration: 1.0,
      ease: 'expo.inOut'
    }, '<')
    // 4. Hero explosion & 3D reveal
    .fromTo('#smoke-canvas', 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 0.78, scale: 1, duration: 1.4, ease: 'power2.out' }, 
      '-=0.7'
    )
    .fromTo('.giant-word-a', 
      { y: 35, scale: 1.15, opacity: 0, filter: 'blur(16px)' }, 
      { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out' }, 
      '-=1.0'
    )
    .fromTo('.giant-word-b', 
      { y: 35, scale: 1.15, opacity: 0, filter: 'blur(16px)' }, 
      { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power4.out' }, 
      '<'
    )
    .fromTo('.cylinder-stage', 
      { scale: 0.18, opacity: 0, rotateX: 25 }, 
      { scale: 1, opacity: 1, rotateX: 0, duration: 1.3, ease: 'elastic.out(1, 0.75)' }, 
      '-=0.9'
    )
    .fromTo('.liquid-nav-shell, .nav-shell', 
      { yPercent: -100, opacity: 0 }, 
      { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 
      '-=0.8'
    )
    .fromTo('.hero-rail span', 
      { y: 22, opacity: 0 }, 
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'power3.out' }, 
      '-=0.7'
    );

  // Vertical parallax on scroll (no horizontal drift so letters never leave the screen)
  gsap.to('.giant-word-a', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.stereo-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.giant-word-b', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.stereo-hero', start: 'top top', end: 'bottom top', scrub: true } });


  gsap.to('[data-chip-track]', { xPercent:-24, ease:'none', scrollTrigger:{ trigger:'.chip-stage', start:'top bottom', end:'bottom top', scrub:1 } });

  qsa('.feature-card').forEach((card, i) => {
    gsap.from(card, { y: i % 2 ? 90 : 55, opacity:0, clipPath:'inset(12% 0 0 0 round 10px)', duration:1.1, ease:'power3.out', scrollTrigger:{ trigger:card, start:'top 88%', once:true } });
    gsap.to(qs('img', card), { yPercent:-8, ease:'none', scrollTrigger:{ trigger:card, start:'top bottom', end:'bottom top', scrub:true } });
  });

  gsap.from('.manifesto p', { opacity:.18, scale:.92, duration:1, scrollTrigger:{ trigger:'.manifesto', start:'top 75%', end:'center center', scrub:.6 } });

  const sphere = qs('[data-sphere]');
  if (sphere) {
    gsap.to(sphere, { rotation:18, scale:1.08, ease:'none', scrollTrigger:{ trigger:'.service-orbit', start:'top bottom', end:'bottom top', scrub:1 } });
    qsa('.sphere-line').forEach((line, i) => {
      gsap.to(line, { x:(i%2?1:-1)*(18+i*6), rotation:(i%2?1:-1)*(5+i), ease:'none', scrollTrigger:{ trigger:'.service-orbit', start:'top 80%', end:'bottom 20%', scrub:1.2 } });
    });
    if (fine) {
      qs('.service-orbit')?.addEventListener('pointermove', e => {
        const x = (e.clientX / innerWidth - .5) * 12;
        const y = (e.clientY / innerHeight - .5) * -9;
        gsap.to(sphere, { rotationY:x, rotationX:y, duration:.5, ease:'power2.out', transformPerspective:1000 });
      });
    }
  }

  qsa('.service-index-list article').forEach((item, i) => {
    gsap.from(item, { y:20, opacity:0, duration:.55, delay:i*.05, scrollTrigger:{ trigger:'.service-index-list', start:'top 88%', once:true } });
  });

  gsap.fromTo('[data-poster-card]', { scale:.72, rotation:-2.2, borderRadius:18 }, { scale:1.03, rotation:0, borderRadius:0, ease:'none', scrollTrigger:{ trigger:'.poster-story', start:'top top', end:'45% top', scrub:1 } });
  gsap.to('[data-poster-card] img', { scale:1.16, ease:'none', scrollTrigger:{ trigger:'.poster-story', start:'top top', end:'55% top', scrub:1 } });
  gsap.from('.profile-copy h2', { y:70, opacity:0, duration:1, scrollTrigger:{ trigger:'.profile-copy', start:'top 75%', once:true } });

  const wallRows = qsa('.contact-wall div');
  wallRows.forEach((row, i) => gsap.to(row, { xPercent:i%2?12:-12, ease:'none', scrollTrigger:{ trigger:'.contact-theatre', start:'top bottom', end:'bottom top', scrub:1 } }));
  gsap.from('.contact-center h2', { scale:.72, opacity:0, letterSpacing:'-.12em', duration:1.15, ease:'power3.out', scrollTrigger:{ trigger:'.contact-theatre', start:'top 65%', once:true } });
  gsap.from('.contact-actions .contact-mini', { y:24, opacity:0, stagger:.1, duration:.6, scrollTrigger:{ trigger:'.contact-actions', start:'top 90%', once:true } });

  // --- AMBIENT SOUNDTRACK & AUDIO CONTROLLER (BULLETPROOF) ---
  const audioController = qs('#audio-controller');
  const audioToggleBtn = qs('#audio-toggle-btn');
  const audioLabel = qs('#audio-label');
  const bgAudio = qs('#bg-soundtrack');

  if (bgAudio && audioToggleBtn) {
    bgAudio.volume = 0.36; // Calibrated: reduced by additional 10% (0.36)

    const setSoundUI = (playing) => {
      audioController?.classList.toggle('is-playing', playing);
      if (audioLabel) audioLabel.textContent = playing ? 'SOUND: ON' : 'SOUND: OFF';
    };

    bgAudio.addEventListener('play', () => setSoundUI(true));
    bgAudio.addEventListener('playing', () => setSoundUI(true));
    bgAudio.addEventListener('pause', () => setSoundUI(false));
    bgAudio.addEventListener('ended', () => setSoundUI(false));

    const cleanupListeners = () => {
      ['mousemove', 'pointermove', 'mouseenter', 'pointerdown', 'click', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(evt => {
        window.removeEventListener(evt, handleUserAction);
        document.removeEventListener(evt, handleUserAction);
      });
    };

    const tryPlay = () => {
      if (!bgAudio.paused) return;
      bgAudio.volume = 0.36;
      const prom = bgAudio.play();
      if (prom && typeof prom.then === 'function') {
        prom.then(() => {
          setSoundUI(true);
          cleanupListeners();
        }).catch(() => {
          // Keep listeners active until browser allows playback
        });
      }
    };

    const handleUserAction = () => {
      if (bgAudio.paused) {
        tryPlay();
      }
    };

    // Toggle button click
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bgAudio.paused) {
        tryPlay();
      } else {
        bgAudio.pause();
      }
    });

    // Continuously listen to mouse movement, pointer, scroll, or keys until playback starts
    ['mousemove', 'pointermove', 'mouseenter', 'pointerdown', 'click', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach(evt => {
      window.addEventListener(evt, handleUserAction, { passive: true });
      document.addEventListener(evt, handleUserAction, { passive: true });
    });

    // Immediate try on page load
    tryPlay();
    window.addEventListener('DOMContentLoaded', tryPlay);
    window.addEventListener('load', tryPlay);
  }

  /* -------------------------------------------------------------------------- */
  /* 9. 3D HOLOGRAPHIC ECOSYSTEM THEATRE (Three.js WebGL + Interactive HUD)     */
  /* -------------------------------------------------------------------------- */
  const initEcosystem3D = () => {
    const container = document.getElementById('ecosystem-3d-container');
    const canvas = document.getElementById('ecosystem-3d-canvas');
    if (!container || !canvas || typeof THREE === 'undefined') return;

    // Service Data Specification
    const servicesData = [
      {
        num: "01",
        badge: "01 / DESARROLLO DIGITAL",
        title: "Páginas Web & Landing Pages de Alta Conversión",
        desc: "Diseño y desarrollo de sitios web modernos, rápidos y optimizados para convertir visitantes en clientes. Estructura pensada para transmitir confianza, posicionar tu marca y generar ventas.",
        specs: [
          "Diseño responsivo fluido adaptado a móviles y escritorios.",
          "Landing pages estratégicas enfocadas en captar clientes.",
          "Integración directa con WhatsApp, formularios y analíticas.",
          "Velocidad de carga ultrarrápida y posicionamiento SEO."
        ],
        ctaText: "Cotizar desarrollo web por WhatsApp",
        ctaUrl: "https://wa.me/51900375447?text=Hola%20Julio%2C%20quisiera%20cotizar%20un%20proyecto%20de%20P%C3%A1ginas%20Web%20o%20Landing%20Page.",
        meta: "Entrega 100% personalizada y soporte directo",
        color: 0x38bdf8
      },
      {
        num: "02",
        badge: "02 / MOVILIDAD DIGITAL",
        title: "Desarrollo de Aplicativos Móviles Android",
        desc: "Creación de aplicaciones nativas y personalizadas para dispositivos Android. Lleva la operación, ventas o gestión de tu negocio al bolsillo de tus clientes y colaboradores.",
        specs: [
          "Aplicaciones Android a medida para ventas, pedidos y campo.",
          "Interfaz de usuario ágil, intuitiva y moderna.",
          "Capacidad offline-first y sincronización de datos.",
          "Generación de ejecutables APK listos para instalar."
        ],
        ctaText: "Cotizar aplicación Android por WhatsApp",
        ctaUrl: "https://wa.me/51900375447?text=Hola%20Julio%2C%20quisiera%20cotizar%20un%20proyecto%20de%20Aplicativo%20Android.",
        meta: "Desarrollo seguro, escalable y optimizado",
        color: 0x34d399
      },
      {
        num: "03",
        badge: "03 / GESTIÓN EMPRESARIAL",
        title: "Sistemas de Gestión a Medida para PYMES",
        desc: "Software administrativo y comercial diseñado para pequeñas y medianas empresas. Centraliza tus operaciones, controla inventarios y toma decisiones con información clara y en tiempo real.",
        specs: [
          "Control de inventarios, entradas, salidas y stock crítico.",
          "Módulo de punto de venta (POS), cobros y facturación.",
          "Cuentas por cobrar, cuentas por pagar y flujo de caja.",
          "Panel de administración centralizado con reportes ejecutivos."
        ],
        ctaText: "Cotizar sistema para PYME por WhatsApp",
        ctaUrl: "https://wa.me/51900375447?text=Hola%20Julio%2C%20quisiera%20cotizar%20un%20Sistema%20para%20mi%20empresa.",
        meta: "Arquitectura administrativa + técnica probada",
        color: 0xf59e0b
      },
      {
        num: "04",
        badge: "04 / AUTOMATIZACIÓN",
        title: "Automatización con Excel y Programación VBA",
        desc: "Transformación de hojas de cálculo comunes en potentes sistemas automatizados. Eliminamos el error humano y aceleramos horas de trabajo repetitivo a un solo clic con macros y formularios.",
        specs: [
          "Programación de Macros en VBA para procesos repetitivos.",
          "Formularios de ingreso interactivos (UserForms) blindados contra errores.",
          "Dashboards dinámicos con indicadores clave de rendimiento (KPIs).",
          "Consolidación y limpieza automática de grandes volúmenes de datos."
        ],
        ctaText: "Cotizar automatización en Excel por WhatsApp",
        ctaUrl: "https://wa.me/51900375447?text=Hola%20Julio%2C%20quisiera%20cotizar%20un%20trabajo%20de%20Excel%20y%20VBA.",
        meta: "Ahorro de hasta 85% de tiempo operativo",
        color: 0xe25c47
      },
      {
        num: "05",
        badge: "05 / PRODUCTIVIDAD & DOCUMENTACIÓN",
        title: "Soluciones de Ofimática Avanzada & Consultoría",
        desc: "Optimización y estandarización integral de la documentación y flujos de oficina. Formato corporativo de alto nivel, plantillas inteligentes y presentaciones ejecutivas de impacto.",
        specs: [
          "Plantillas corporativas automatizadas en Word con estilos institucionales.",
          "Presentaciones de alto impacto visual y comercial en PowerPoint.",
          "Estandarización de formatos administrativos y operacionales.",
          "Asesoría y estructuración de procesos de oficina y flujos de trabajo."
        ],
        ctaText: "Cotizar soluciones de ofimática por WhatsApp",
        ctaUrl: "https://wa.me/51900375447?text=Hola%20Julio%2C%20quisiera%20cotizar%20soluciones%20de%20Ofim%C3%A1tica%20Avanzada.",
        meta: "Elegancia corporativa y máxima eficiencia",
        color: 0xa78bfa
      }
    ];

    let activeServiceIndex = 0;
    const tabs = document.querySelectorAll('.eco-tab');
    const panelCard = document.getElementById('eco-panel-card');
    const badgeEl = document.getElementById('eco-badge');
    const titleEl = document.getElementById('eco-title');
    const descEl = document.getElementById('eco-desc');
    const specsEl = document.getElementById('eco-specs');
    const ctaEl = document.getElementById('eco-cta');
    const metaEl = document.getElementById('eco-meta');

    // UI Tab Switch Function
    const switchService = (index, from3D = false) => {
      if (index === activeServiceIndex && !from3D) return;
      activeServiceIndex = index;

      // Update tabs
      tabs.forEach((tab, i) => {
        const isActive = i === index;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update Card with subtle fade
      if (panelCard) {
        panelCard.style.opacity = '0.3';
        panelCard.style.transform = 'translateY(6px)';
        setTimeout(() => {
          const data = servicesData[index];
          if (badgeEl) badgeEl.textContent = data.badge;
          if (titleEl) titleEl.textContent = data.title;
          if (descEl) descEl.textContent = data.desc;
          if (metaEl) metaEl.textContent = data.meta;
          if (ctaEl) {
            ctaEl.href = data.ctaUrl;
            const span = ctaEl.querySelector('span');
            if (span) span.textContent = data.ctaText;
          }
          if (specsEl) {
            specsEl.innerHTML = data.specs.map(spec => `
              <div class="eco-spec-item">
                <span class="eco-check">✓</span>
                <span>${spec}</span>
              </div>
            `).join('');
          }
          panelCard.style.opacity = '1';
          panelCard.style.transform = 'translateY(0)';
        }, 180);
      }
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => switchService(i));
    });

    // ---------------- THREE.JS 3D SCENE SETUP ----------------
    let width = container.clientWidth || 600;
    let height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d0d0b, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 8.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLightA = new THREE.PointLight(0xff6d50, 2.5, 20);
    pointLightA.position.set(5, 4, 4);
    scene.add(pointLightA);

    const pointLightB = new THREE.PointLight(0x38bdf8, 2.5, 20);
    pointLightB.position.set(-5, -3, 4);
    scene.add(pointLightB);

    // Group for all rotating 3D objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Central Core: Geometric Icosahedron + Wireframe Shell
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x161513,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0x22130e,
      emissiveIntensity: 0.4
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    const wireGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xe25c47,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    mainGroup.add(wireMesh);

    // Core Ring
    const ringGeo = new THREE.TorusGeometry(1.65, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const coreRing = new THREE.Mesh(ringGeo, ringMat);
    coreRing.rotation.x = Math.PI * 0.4;
    mainGroup.add(coreRing);

    // Orbital Path Rings
    const orbitRadius = 3.6;
    const orbitLineGeo = new THREE.BufferGeometry();
    const orbitPoints = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
    }
    orbitLineGeo.setFromPoints(orbitPoints);
    const orbitLineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
    orbitLine.rotation.x = 0.25;
    mainGroup.add(orbitLine);

    // 5 Orbital Nodes (Planetary Satellites)
    const nodeMeshes = [];
    const nodeCount = 5;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const nodeGroup = new THREE.Group();

      const sphereGeo = new THREE.SphereGeometry(0.35, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: servicesData[i].color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: servicesData[i].color,
        emissiveIntensity: 0.3
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphere);

      // Node Halo
      const haloGeo = new THREE.RingGeometry(0.45, 0.49, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: servicesData[i].color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI * 0.5;
      nodeGroup.add(halo);

      nodeGroup.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle) * 0.6,
        Math.sin(angle) * orbitRadius
      );
      nodeGroup.userData = { index: i, baseScale: 1, angle: angle };
      mainGroup.add(nodeGroup);
      nodeMeshes.push(nodeGroup);
    }

    // Ambient Floating Star/Data Particles
    const particleCount = 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 14;
      pPos[i + 1] = (Math.random() - 0.5) * 10;
      pPos[i + 2] = (Math.random() - 0.5) * 14;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.4
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse Interaction & Raycasting
    let mouse = new THREE.Vector2(-999, -999);
    let targetRotationY = 0;
    let targetRotationX = 0;
    let isPointerDown = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isPointerDown) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.008;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        targetRotationY = mouse.x * 0.45;
        targetRotationX = -mouse.y * 0.25;
      }
    };

    const onPointerDown = (e) => {
      isPointerDown = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerUp = () => {
      isPointerDown = false;
    };

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);
      if (intersects.length > 0) {
        let topGroup = intersects[0].object;
        while (topGroup.parent && topGroup.parent !== mainGroup) {
          topGroup = topGroup.parent;
        }
        if (topGroup.userData && typeof topGroup.userData.index === 'number') {
          switchService(topGroup.userData.index);
        }
      }
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    container.addEventListener('click', onClick);

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
      height = container.clientHeight || 450;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // Visibility Observer to pause loop when out of screen for max 60FPS performance
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    observer.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth Rotation interpolation
      mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05 + 0.003;
      mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

      // Core animations
      coreMesh.rotation.y += 0.01;
      wireMesh.rotation.y -= 0.008;
      wireMesh.rotation.x += 0.005;
      coreRing.rotation.z += 0.006;
      particles.rotation.y = time * 0.02;

      // Pulse nodes and handle hover scale
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes, true);
      let hoveredIndex = -1;
      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        let topGroup = intersects[0].object;
        while (topGroup.parent && topGroup.parent !== mainGroup) {
          topGroup = topGroup.parent;
        }
        if (topGroup.userData) hoveredIndex = topGroup.userData.index;
      } else {
        container.style.cursor = isPointerDown ? 'grabbing' : 'grab';
      }

      nodeMeshes.forEach((node, i) => {
        const isSelected = i === activeServiceIndex;
        const isHovered = i === hoveredIndex;
        const targetScale = isSelected ? 1.35 : (isHovered ? 1.25 : 1.0);
        node.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        node.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();
  };

  // Initialize 3D Ecosystem Theatre
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEcosystem3D);
  } else {
    initEcosystem3D();
  }

  addEventListener('load', () => ScrollTrigger.refresh(), { once:true });
})();
