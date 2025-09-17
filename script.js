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

    // Find this script's absolute URL so we can derive the site root reliably
    const scriptUrl = getScriptUrl();
    if(!scriptUrl){
      console.error('script.js: could not determine script URL');
      return;
    }

    // navbar.html lives next to script.js (project root)
    const navbarUrl = new URL('navbar.html', scriptUrl);

    try {
      const res = await fetch(navbarUrl.href, { cache: 'no-cache' });
      if(!res.ok) throw new Error(`Failed to load navbar: ${res.status} ${res.statusText}`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Rewrite any relative links/images inside the injected navbar so they work from any subfolder
      const baseDir = new URL('.', scriptUrl);

      placeholder.querySelectorAll('[href^="./"]').forEach(el => {
        const rel = el.getAttribute('href').replace(/^\.\//, '');
        const url = new URL(rel, baseDir);
        el.setAttribute('href', url.href);
      });

      placeholder.querySelectorAll('[src^="./"]').forEach(el => {
        const rel = el.getAttribute('src').replace(/^\.\//, '');
        const url = new URL(rel, baseDir);
        el.setAttribute('src', url.href);
      });

      // Mobile menu toggle exposed globally
      window.toggleMenu = function(){
        const menu = placeholder.querySelector('.nav-menu');
        if(menu) menu.classList.toggle('open');
      };
    } catch (err){
      console.error('Navbar injection error:', err);
    }
  }

  async function loadCarousel(){
    const container = document.getElementById('updates');
    if(!container) return; // Only on pages that have the carousel

    try{
      const feedUrl = resolveFromRoot('updates.json');
      const res = await fetch(feedUrl, { cache: 'no-cache' });
      if(!res.ok) throw new Error(`Failed to load updates.json: ${res.status} ${res.statusText}`);
      const items = await res.json();

      // Build cards
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