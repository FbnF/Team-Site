

(function(){
  async function injectNavbar(){
    const placeholder = document.getElementById('navbar-placeholder');
    if(!placeholder) return;

    // Find this script's absolute URL so we can derive the site root reliably
    const scripts = document.getElementsByTagName('script');
    const thisScript = document.currentScript || Array.from(scripts).find(s => (s.src || '').includes('script.js'));
    if(!thisScript || !thisScript.src){
      console.error('script.js: could not determine script URL');
      return;
    }
    const scriptUrl = new URL(thisScript.src);

    // navbar.html lives next to script.js (project root)
    const navbarUrl = new URL('navbar.html', scriptUrl);

    try {
      const res = await fetch(navbarUrl.href, { cache: 'no-cache' });
      if(!res.ok) throw new Error(`Failed to load navbar: ${res.status} ${res.statusText}`);
      const html = await res.text();
      placeholder.innerHTML = html;

      // Rewrite any relative links/images inside the injected navbar so they work from any subfolder
      const baseDir = new URL('.', scriptUrl); // directory containing script.js

      placeholder.querySelectorAll('[href^="./"]').forEach(el => {
        const rel = el.getAttribute('href').replace(/^\.\//, '');
        const url = new URL(rel, baseDir);
        el.setAttribute('href', url.pathname); // keeps repo path for GH Pages
      });

      placeholder.querySelectorAll('[src^="./"]').forEach(el => {
        const rel = el.getAttribute('src').replace(/^\.\//, '');
        const url = new URL(rel, baseDir);
        el.setAttribute('src', url.pathname);
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

  document.addEventListener('DOMContentLoaded', injectNavbar);
})();