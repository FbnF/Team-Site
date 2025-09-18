// script.js (project root)

// IIFE wrapper
(function(){
  function getScriptUrl(){
    const scripts = document.getElementsByTagName('script');
    const thisScript = document.currentScript || Array.from(scripts).find(s => (s.src || '').includes('script.js'));
    if(!thisScript || !thisScript.src) return null;
    return new URL(thisScript.src);
  }

  function resolveFromRoot(relPath){
    const scriptUrl = getScriptUrl();
    if(!scriptUrl) return relPath;
    const baseDir = new URL('.', scriptUrl);
    return new URL(relPath, baseDir).pathname;
  }

  async function injectNavbar(){
    const placeholder = document.getElementById('navbar-placeholder');
    if(!placeholder) return;

    const scriptUrl = getScriptUrl();
    if(!scriptUrl){
      console.error('script.js: could not determine script URL');
      return;
    }

    const navbarUrl = new URL('navbar.html', scriptUrl);

    try {
      const res = await fetch(navbarUrl.href, { cache: 'no-cache' });
      if(!res.ok) throw new Error(`Failed to load navbar: ${res.status} ${res.statusText}`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Rewrite relative URLs inside injected navbar so it works in subfolders
      const baseDir = new URL('.', scriptUrl);
      placeholder.querySelectorAll('[href^="./"]').forEach(el => {
        const rel = el.getAttribute('href').replace(/^\.\//, '');
        el.setAttribute('href', new URL(rel, baseDir).href);
      });
      placeholder.querySelectorAll('[src^="./"]').forEach(el => {
        const rel = el.getAttribute('src').replace(/^\.\//, '');
        el.setAttribute('src', new URL(rel, baseDir).href);
      });

      // Expose toggleMenu globally (inline onclick relies on this)
      window.toggleMenu = function(){
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

    } catch (err){
      console.error('Navbar injection error:', err);
    }
  }

  function enableMobileDropdown(scope){
    const mm = window.matchMedia('(max-width: 768px)');
    const dropdowns = scope.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
      const trigger = dropdown.querySelector(':scope > a');
      if (!trigger) return;

      // Prevent duplicate handlers when reinjecting
      trigger._fbnfBound && trigger.removeEventListener('click', trigger._fbnfHandler);

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

  async function loadCarousel(){
    const container = document.getElementById('updates');
    if(!container) return;
    try{
      const feedUrl = resolveFromRoot('updates.json');
      const res = await fetch(feedUrl, { cache: 'no-cache' });
      if(!res.ok) throw new Error(`Failed to load updates.json: ${res.status} ${res.statusText}`);
      const items = await res.json();
      const html = (items || []).map(item => {
        const link = resolveFromRoot(item.link);
        const img  = resolveFromRoot(item.image);
        const title = item.title || '';
        const date = item.date || '';
        return `
          <a href="${link}" class="latest-card">
            <img src="${img}" alt="${title}" />
            <div class="card-caption">${date} – ${title}</div>
          </a>
        `;
      }).join('');
      container.innerHTML = html || '<div style="opacity:.7">No updates yet.</div>';
    } catch(err){
      console.error('Carousel load error:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
  });
})();