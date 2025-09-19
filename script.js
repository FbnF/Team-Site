// script.js (project root)

// IIFE wrapper
(function () {
  function getScriptUrl() {
    const scripts = document.getElementsByTagName('script');
    const thisScript =
      document.currentScript ||
      Array.from(scripts).find((s) => (s.src || '').includes('script.js'));
    if (!thisScript || !thisScript.src) return null;
    return new URL(thisScript.src);
  }

  function resolveFromRoot(relPath) {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) return relPath;
    const baseDir = new URL('.', scriptUrl);
    // Use .href so it also works under subpaths (e.g., GitHub Pages)
    return new URL(relPath, baseDir).href;
  }

  async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      console.error('script.js: could not determine script URL');
      return;
    }

    const navbarUrl = new URL('navbar.html', scriptUrl);

    try {
      const res = await fetch(navbarUrl.href, { cache: 'no-cache' });
      if (!res.ok)
        throw new Error(`Failed to load navbar: ${res.status} ${res.statusText}`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Rewrite relative URLs inside injected navbar so it works in subfolders
      const baseDir = new URL('.', scriptUrl);
      placeholder.querySelectorAll('[href^="./"]').forEach((el) => {
        const rel = el.getAttribute('href').replace(/^\.\//, '');
        el.setAttribute('href', new URL(rel, baseDir).href);
      });
      placeholder.querySelectorAll('[src^="./"]').forEach((el) => {
        const rel = el.getAttribute('src').replace(/^\.\//, '');
        el.setAttribute('src', new URL(rel, baseDir).href);
      });

      // Expose toggleMenu globally (inline onclick relies on this)
      window.toggleMenu = function () {
        const menu = placeholder.querySelector('.nav-menu');
        const burger = placeholder.querySelector('.menu-toggle');
        if (!menu) return;

        const isOpen = menu.classList.toggle('open'); // CSS recognizes .open
        if (burger) {
          burger.setAttribute('aria-expanded', String(isOpen));
          burger.setAttribute('aria-controls', menu.id || 'primary-menu');
        }
        if (!menu.id) menu.id = 'primary-menu';
      };

      // Mobile dropdown tap support (in addition to desktop hover)
      enableMobileDropdown(placeholder);
    } catch (err) {
      console.error('Navbar injection error:', err);
    }
  }

  function enableMobileDropdown(scope) {
    const mm = window.matchMedia('(max-width: 768px)');
    const dropdowns = scope.querySelectorAll('.dropdown');

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector(':scope > a');
      if (!trigger) return;

      // Prevent duplicate handlers when reinjecting
      trigger._fbnfBound &&
        trigger.removeEventListener('click', trigger._fbnfHandler);

      const handler = (e) => {
        if (mm.matches) {
          e.preventDefault();
          const expanded = dropdown.classList.toggle('open');
          trigger.setAttribute('aria-expanded', String(expanded));
        }
      };
      trigger.addEventListener('click', handler);
      trigger._fbnfBound = true;
      trigger._fbnfHandler = handler;
    });
  }

  // ---- Blog "stack" carousel rotation (ONLY for #updates) ----
  function startStackCarousel(container) {
    if (!container) return;

    // Avoid duplicate timers if this is called multiple times
    if (container._carouselTimer) {
      clearInterval(container._carouselTimer);
      container._carouselTimer = null;
    }

    const mmMobile = window.matchMedia('(max-width: 768px)');
    let paused = false;

    // Optional: pause on hover (desktop)
    container.addEventListener('mouseenter', () => (paused = true));
    container.addEventListener('mouseleave', () => (paused = false));

    const rotateOnce = () => {
      // Do not rotate on mobile layout (where cards are listed vertically)
      if (mmMobile.matches || paused) return;

      const cards = container.querySelectorAll(':scope > .latest-card');
      if (cards.length < 2) return;

      const first = cards[0];
      // fade out the top card, then move it to the end
      first.classList.add('fade-out');

      // Match this timeout to your .fade-out { transition: 0.3s }
      setTimeout(() => {
        first.classList.remove('fade-out');
        container.appendChild(first); // nth-child() CSS restacks automatically
      }, 300);
    };

    container._carouselTimer = setInterval(rotateOnce, 3000);

    // Optional: pause when the tab is hidden to save CPU
    const visHandler = () => {
      if (document.hidden) {
        paused = true;
      } else {
        paused = false;
      }
    };
    document.addEventListener('visibilitychange', visHandler, { passive: true });

    // Store cleanup if you ever need it
    container._cleanupCarousel = () => {
      clearInterval(container._carouselTimer);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }

  async function loadCarousel() {
    const container = document.getElementById('updates');
    if (!container) return;
    try {
      const feedUrl = resolveFromRoot('updates.json');
      const res = await fetch(feedUrl, { cache: 'no-cache' });
      if (!res.ok)
        throw new Error(
          `Failed to load updates.json: ${res.status} ${res.statusText}`
        );
      const items = await res.json();

      // If you want newest-first limited to 3, uncomment:
      // const list = (items || [])
      //   .slice()
      //   .sort((a, b) => new Date(b.date) - new Date(a.date))
      //   .slice(0, 3);

      const list = items || [];
      const html = list
        .map((item) => {
          const link = resolveFromRoot(item.link);
          const img = resolveFromRoot(item.image);
          const title = item.title || '';
          const date = item.date || '';
          return `
            <a href="${link}" class="latest-card">
              <img src="${img}" alt="${title}" />
              <div class="card-caption">${date} – ${title}</div>
            </a>
          `;
        })
        .join('');
      container.innerHTML = html || '<div style="opacity:.7">No updates yet.</div>';
    } catch (err) {
      console.error('Carousel load error:', err);
      // Keep whatever static fallback is already in the HTML
    } finally {
      // Start rotation whether JSON succeeded or we’re using the fallback
      startStackCarousel(container);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
  });
})();