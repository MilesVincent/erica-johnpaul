/**
 * ═══════════════════════════════════════════════════════
 *  ELEANOR & JAMES — WEDDING WEBSITE  |  script.js
 *  Features:
 *    - Preloader
 *    - Sticky header with scroll behaviour
 *    - Hamburger / mobile nav
 *    - Hero image slider with autoplay & dots
 *    - Countdown timer
 *    - Scroll-reveal animations (IntersectionObserver)
 *    - Active nav link highlight on scroll
 *    - Wedding-party filter tabs
 *    - Lightbox gallery with keyboard navigation
 *    - RSVP form validation + simulated submission
 *    - Back-to-top button
 *    - Theme switcher (light/dark + colour palettes)
 * ═══════════════════════════════════════════════════════
 */

'use strict';

/* ─── UTILITY HELPERS ──────────────────────────────────── */

/** Simple DOM selector helpers */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Debounce — limits how often a function fires */
function debounce(fn, delay = 100) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/* ─── 1. PRELOADER ─────────────────────────────────────── */
(function initPreloader() {
  const preloader = $('#preloader');
  if (!preloader) return;

  const minDelay  = 1800;  // minimum ms so the animation looks intentional
  const maxDelay  = 4000;  // hard cap — never block longer than 4 s
  const start     = Date.now();
  let   dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    preloader.classList.add('hidden');
    preloader.addEventListener('transitionend', () => preloader.remove(), { once: true });
    // Safety net: remove from DOM even if transitionend never fires
    setTimeout(() => { if (preloader.parentNode) preloader.remove(); }, 800);
  }

  // Dismiss after page load, but respect minDelay
  window.addEventListener('load', () => {
    const elapsed = Date.now() - start;
    const wait    = Math.max(0, minDelay - elapsed);
    setTimeout(dismiss, wait);
  });

  // Hard fallback — always dismiss by maxDelay regardless of load state
  setTimeout(dismiss, maxDelay);
})();

/* ─── 2. STICKY HEADER ─────────────────────────────────── */
(function initHeader() {
  const header = $('#site-header');
  if (!header) return;

  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 50);
    // Hide header on fast scroll-down only on larger screens.
    // On mobile (≤900px) always keep it visible so hamburger stays accessible.
    const isMobile = window.innerWidth <= 900;
    if (!isMobile && y > 200) {
      header.style.transform = y > lastScroll && y - lastScroll > 8
        ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      header.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();

/* ─── 3. HAMBURGER / MOBILE NAV ────────────────────────── */
(function initMobileNav() {
  const hamburger = $('#hamburger');
  const nav       = $('#main-nav');
  if (!hamburger || !nav) return;

  function openMenu() {
    hamburger.classList.add('open');
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when a nav link is clicked
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      closeMenu();
      // Allow anchor navigation to work
    });
  });

  // Close when clicking the overlay (body::after pseudo-element area)
  document.addEventListener('click', e => {
    if (nav.classList.contains('open') &&
  !nav.contains(e.target) &&
  !hamburger.contains(e.target)
) {
  closeMenu();
}
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu();
  });
})();

/* ─── 4. SMOOTH-SCROLL & ACTIVE NAV LINK ──────────────── */
(function initSmoothScroll() {
  // Override default anchor scroll to account for fixed header height
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = $(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Highlight active nav link based on scroll position
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        const active = navLinks.find(l => l.getAttribute('href') === `#${entry.target.id}`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();

/* ─── 5. HERO IMAGE SLIDER ─────────────────────────────── */
(function initSlider() {
  const slider  = $('#hero-slider');
  const dotsWrap = $('#slider-dots');
  if (!slider) return;

  const slides = $$('.slide', slider);
  let current  = 0;
  let timer;
  const INTERVAL = 5500;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function getDots() { return $$('.slider-dot', dotsWrap); }

  function goTo(index) {
    slides[current].classList.remove('active');
    getDots()[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    getDots()[current].classList.add('active');
    resetTimer();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, INTERVAL);
  }

  // Controls
  const prevBtn = $('.slider-prev');
  const nextBtn = $('.slider-next');
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  // Keyboard
  document.addEventListener('keydown', e => {
    if ($('#lightbox').classList.contains('open')) return; // don't conflict with lightbox
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Pause on hover
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', resetTimer);

  // Touch swipe support
  let touchStartX = 0;
  slider.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
  }, { passive: true });

  resetTimer();
})();

/* ─── 6. COUNTDOWN TIMER ───────────────────────────────── */
(function initCountdown() {
  const weddingDate = new Date('2026-09-18T16:00:00');

  const elDays  = $('#cd-days');
  const elHours = $('#cd-hours');
  const elMins  = $('#cd-mins');
  const elSecs  = $('#cd-secs');
  if (!elDays) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      elDays.textContent = elHours.textContent = elMins.textContent = elSecs.textContent = '00';
      return;
    }

    elDays.textContent  = pad(Math.floor(diff / 864e5));
    elHours.textContent = pad(Math.floor((diff % 864e5) / 36e5));
    elMins.textContent  = pad(Math.floor((diff % 36e5) / 6e4));
    elSecs.textContent  = pad(Math.floor((diff % 6e4) / 1e3));
  }

  tick();
  setInterval(tick, 1000);
})();

/* ─── 7. SCROLL REVEAL ANIMATIONS ─────────────────────── */
(function initReveal() {
  const elements = $$('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => obs.observe(el));
})();

/* ─── 8. WEDDING PARTY FILTER TABS ─────────────────────── */
(function initFilter() {
  const filterBtns = $$('.filter-btn');
  const cards      = $$('.people-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show / hide cards with animation
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.group === filter;
        if (match) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // Scroll the people grid into view smoothly
      const peopleGrid = $('#people-grid');
      if (peopleGrid) {
        setTimeout(() => {
          peopleGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    });
  });
})();

/* ─── 9. LIGHTBOX GALLERY ──────────────────────────────── */
(function initLightbox() {
  const lightbox = $('#lightbox');
  const lbImg    = $('#lb-img');
  const lbLoader = $('.lb-loader', lightbox);
  const lbCounter= $('#lb-counter');
  const lbClose  = $('#lb-close');
  const lbPrev   = $('#lb-prev');
  const lbNext   = $('#lb-next');
  if (!lightbox) return;

  const items = $$('.gallery-item');
  const srcs  = items.map(el => el.dataset.src);
  let current = 0;

  function openLightbox(index) {
    current = index;
    loadImage(current);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.classList.remove('loaded');
  }

  function loadImage(index) {
    lbImg.classList.remove('loaded');
    lbLoader.style.display = 'flex';
    lbCounter.textContent = `${index + 1} / ${srcs.length}`;

    const img = new Image();
    img.src = srcs[index];
    img.onload = () => {
      lbImg.src = srcs[index];
      lbImg.alt = `Gallery image ${index + 1}`;
      lbLoader.style.display = 'none';
      lbImg.classList.add('loaded');
    };
    img.onerror = () => {
      lbLoader.style.display = 'none';
    };
  }

  function showPrev() { current = (current - 1 + srcs.length) % srcs.length; loadImage(current); }
  function showNext() { current = (current + 1) % srcs.length; loadImage(current); }

  // Open on click
  items.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Open image ${i + 1}`);
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(i); });
  });

  // Controls
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', showPrev);
  lbNext.addEventListener('click', showNext);

  // Close on backdrop click
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? showNext() : showPrev();
  }, { passive: true });
})();

/* ─── 10. RSVP FORM ────────────────────────────────────── */
(function initRSVP() {
  const form       = $('#rsvp-form');
  const successMsg = $('#form-success');
  const failMsg    = $('#form-fail');
  if (!form) return;

  /** Validate a single input element; returns true if valid */
  function validateField(field) {
    const errorEl = field.closest('.form-group')?.querySelector('.form-error')
                  || $('#attendance-error');
    const val = field.value.trim();
    let msg = '';

    if (field.required && !val) {
      msg = 'This field is required.';
    } else if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      msg = 'Please enter a valid email address.';
    }

    if (errorEl) errorEl.textContent = msg;
    field.classList.toggle('error', !!msg);
    return !msg;
  }

  /** Validate attendance radio group */
  function validateAttendance() {
    const checked = form.querySelector('input[name="attendance"]:checked');
    const errorEl = $('#attendance-error');
    if (!checked) {
      if (errorEl) errorEl.textContent = 'Please select your attendance.';
      return false;
    }
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  // Live validation on blur
  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });

  // Submit handler
  form.addEventListener('submit', e => {
    // Validate all required fields
    let valid = true;
    $$('input[required], select[required]', form).forEach(field => {
      if (!validateField(field)) valid = false;
    });
    if (!validateAttendance()) valid = false;
    
    // If validation fails, prevent submission
    if (!valid) {
      e.preventDefault();
      return;
    }

    // If validation passes, allow natural form submission to FormSubmit
    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Sending…';
  });
})();

/* ─── 11. BACK-TO-TOP BUTTON ───────────────────────────── */
(function initBackTop() {
  const btn = $('#back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ─── 12. THEME SWITCHER ───────────────────────────────── */
(function initTheme() {
  const panel      = $('#theme-switcher');
  const toggleBtn  = $('#theme-toggle-btn');
  const modeBtns   = $$('.mode-btn');
  const swatches   = $$('.swatch');
  const html       = document.documentElement;
  if (!panel) return;

  // Load saved preferences
  const savedMode  = localStorage.getItem('ww-mode')  || 'light';
  const savedColor = localStorage.getItem('ww-color') || 'rose';
  applyMode(savedMode);
  applyColor(savedColor);

  // Toggle drawer
  toggleBtn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target)) panel.classList.remove('open');
  });

  // Mode buttons
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyMode(btn.dataset.mode);
      localStorage.setItem('ww-mode', btn.dataset.mode);
    });
  });

  // Color swatches
  swatches.forEach(sw => {
    sw.addEventListener('click', () => {
      applyColor(sw.dataset.color);
      localStorage.setItem('ww-color', sw.dataset.color);
    });
  });

  function applyMode(mode) {
    html.setAttribute('data-theme', mode);
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  }

  function applyColor(color) {
    html.setAttribute('data-color', color);
    swatches.forEach(s => s.classList.toggle('active', s.dataset.color === color));
  }
})();

/* ─── 13. PEOPLE CARD REVEAL (staggered) ──────────────── */
(function initPeopleReveal() {
  const cards = $$('.people-card');

  const obs = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) {
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80);
      });
      obs.disconnect();
    }
  }, { threshold: 0.1 });

  // Initial state
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity .5s ease, transform .5s ease';
  });

  const grid = $('#people-grid');
  if (grid) obs.observe(grid);
})();

/* ─── 14. PARALLAX HERO (subtle) ──────────────────────── */
(function initParallax() {
  const hero   = $('.hero');
  const slides = $$('.slide');
  if (!hero || !slides.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    slides.forEach(slide => {
      slide.style.transform = `translateY(${y * 0.25}px)`;
    });
  }, { passive: true });
})();

/* ─── 15. HEADER LOGO HIDE / SHOW ─────────────────────── */
/* Already handled by CSS :not(.scrolled) rules — no JS needed */

/* ─── INIT LOG ─────────────────────────────────────────── */
console.log('%c Erica & John Paul 💍 Wedding Website ', 'background:#c9788a;color:#fff;padding:4px 12px;border-radius:4px;font-size:13px;');