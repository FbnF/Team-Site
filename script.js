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

      const baseDir = new URL('.', scriptUrl);
      placeholder.querySelectorAll('[href^="./"]').forEach((el) => {
        const rel = el.getAttribute('href').replace(/^\.\//, '');
        el.setAttribute('href', new URL(rel, baseDir).href);
      });
      placeholder.querySelectorAll('[src^="./"]').forEach((el) => {
        const rel = el.getAttribute('src').replace(/^\.\//, '');
        el.setAttribute('src', new URL(rel, baseDir).href);
      });

      window.toggleMenu = function () {
        const menu = placeholder.querySelector('.nav-menu');
        const burger = placeholder.querySelector('.menu-toggle');
        if (!menu) return;

        const isOpen = menu.classList.toggle('open');
        if (burger) {
          burger.setAttribute('aria-expanded', String(isOpen));
          burger.setAttribute('aria-controls', menu.id || 'primary-menu');
        }
        if (!menu.id) menu.id = 'primary-menu';
      };

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

  function startStackCarousel(container) {
    if (!container) return;
    if (container._carouselTimer) {
      clearInterval(container._carouselTimer);
      container._carouselTimer = null;
    }

    const mmMobile = window.matchMedia('(max-width: 768px)');
    let paused = false;

    container.addEventListener('mouseenter', () => (paused = true));
    container.addEventListener('mouseleave', () => (paused = false));

    const rotateOnce = () => {
      if (mmMobile.matches || paused) return;
      const cards = container.querySelectorAll(':scope > .latest-card');
      if (cards.length < 2) return;

      const first = cards[0];
      first.classList.add('fade-out');

      setTimeout(() => {
        first.classList.remove('fade-out');
        container.appendChild(first);
      }, 300);
    };

    container._carouselTimer = setInterval(rotateOnce, 3000);

    const visHandler = () => {
      paused = document.hidden;
    };
    document.addEventListener('visibilitychange', visHandler, { passive: true });
  }

  async function loadCarousel() {
    const container = document.getElementById('updates');
    if (!container) return;
    try {
      const feedUrl = resolveFromRoot('updates.json');
      const res = await fetch(feedUrl, { cache: 'no-cache' });
      if (!res.ok)
        throw new Error(`Failed to load updates.json: ${res.status} ${res.statusText}`);
      const items = await res.json();

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
    } finally {
      startStackCarousel(container);
    }
  }

  // ---- NEW: FTC SEASON TELEMETRY ENGINE ----
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  async function fetchSeasonData() {
    const root = document.getElementById('season-root');
    if (!root) return;

    const auth = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
    const headers = { 'Authorization': `Basic ${auth}` };

    try {
      // 1. Get Events
      const evRes = await fetch(`https://ftc-api.firstinspires.org/v2.0/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`, { headers });
      const evData = await evRes.json();
      const events = evData.events.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart)); // Newest first

      root.innerHTML = "";

      for (const event of events) {
        const eventDate = new Date(event.dateStart);
        const isFuture = eventDate > new Date();
        const block = document.createElement('div');
        block.className = "event-block";

// script.js (Full Integrated Version)

(function () {
  // --- CONFIGURATION ---
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  const PROXY = "https://api.allorigins.win/raw?url=";
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  // --- NAVBAR & UTILITIES ---
  function getScriptUrl() {
    const scripts = document.getElementsByTagName('script');
    const thisScript = document.currentScript || Array.from(scripts).find((s) => (s.src || '').includes('script.js'));
    return thisScript ? new URL(thisScript.src) : null;
  }

  function resolveFromRoot(relPath) {
    const url = getScriptUrl();
    return url ? new URL(relPath, new URL('.', url)).href : relPath;
  }

  async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    const url = getScriptUrl();
    const navbarUrl = new URL('navbar.html', url);

    try {
      const res = await fetch(navbarUrl.href, { cache: 'no-cache' });
      const html = await res.text();
      placeholder.innerHTML = html;

      const baseDir = new URL('.', url);
      placeholder.querySelectorAll('[href^="./"], [src^="./"]').forEach((el) => {
        const attr = el.hasAttribute('href') ? 'href' : 'src';
        const rel = el.getAttribute(attr).replace(/^\.\//, '');
        el.setAttribute(attr, new URL(rel, baseDir).href);
      });

      window.toggleMenu = () => {
        const menu = placeholder.querySelector('.nav-menu');
        menu.classList.toggle('open');
      };
    } catch (err) { console.error('Navbar error:', err); }
  }

  // --- CAROUSEL ---
  function startStackCarousel(container) {
    if (!container) return;
    const rotateOnce = () => {
      if (window.matchMedia('(max-width: 768px)').matches || document.hidden) return;
      const cards = container.querySelectorAll(':scope > .latest-card');
      if (cards.length < 2) return;
      const first = cards[0];
      first.classList.add('fade-out');
      setTimeout(() => {
        first.classList.remove('fade-out');
        container.appendChild(first);
      }, 300);
    };
    setInterval(rotateOnce, 3000);
  }

  async function loadCarousel() {
    const container = document.getElementById('updates');
    if (!container) return;
    try {
      const res = await fetch(resolveFromRoot('updates.json'), { cache: 'no-cache' });
      const items = await res.json();
      container.innerHTML = items.map(item => `
        <a href="${resolveFromRoot(item.link)}" class="latest-card">
          <img src="${resolveFromRoot(item.image)}" alt="${item.title}" />
          <div class="card-caption">${item.date} – ${item.title}</div>
        </a>
      `).join('');
    } catch (err) { console.error('Carousel error:', err); }
    finally { startStackCarousel(container); }
  }

  // --- TELEMETRY ENGINE (The Fix) ---
  async function fetchSeasonTelemetry() {
    const root = document.getElementById('season-root');
    if (!root) return;

    try {
      // 1. Get Event List via Proxy
      const evUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`);
      const evRes = await fetch(PROXY + evUrl, { headers: { Authorization: `Basic ${AUTH_B64}` } });
      const evData = await evRes.json();
      const events = evData.events.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));

      // 2. Fetch Top Bar Rank/Record
      const rUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/rankings/${events[0].code}?teamNumber=${FTC_CONFIG.team}`);
      fetch(PROXY + rUrl, { headers: { Authorization: `Basic ${AUTH_B64}` } })
        .then(res => res.json())
        .then(data => {
          if (data.rankings?.[0]) {
            document.getElementById('live-rank').innerText = `#${data.rankings[0].rank}`;
            document.getElementById('live-record').innerText = `${data.rankings[0].wins}-${data.rankings[0].losses}-${data.rankings[0].ties}`;
          }
        });

      root.innerHTML = ""; // Clear loader

      // 3. Process Events
      for (const event of events) {
        const block = document.createElement('div');
        block.className = "event-block";
        const isFuture = new Date(event.dateStart) > new Date();

        const mUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`);
        const aUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`);

        const [mRes, aRes] = await Promise.all([
          fetch(PROXY + mUrl, { headers: { Authorization: `Basic ${AUTH_B64}` } }),
          fetch(PROXY + aUrl, { headers: { Authorization: `Basic ${AUTH_B64}` } })
        ]);

        const mData = await mRes.json();
        const aData = await aRes.json();

        let html = `<div class="event-header"><div class="event-info"><h3>${event.name}</h3>
                    <span class="event-date">${new Date(event.dateStart).toLocaleDateString()} | ${event.venue}</span></div></div>`;

        if (aData.awards?.length > 0) {
          html += `<div class="awards-ribbon">` + aData.awards.map(a => `<span class="award-tag">🏆 ${a.name}</span>`).join('') + `</div>`;
        }

        if (mData.matches?.length > 0) {
          html += `<table class="match-table"><thead><tr><th>Match</th><th>Result</th><th>Partner</th><th>Auto</th><th>Tele+End</th><th>Total</th></tr></thead><tbody>`;
          mData.matches.forEach(m => {
            if (m.scoreRedFinal === null) return;
            const isRed = m.teams.find(t => t.teamNumber == FTC_CONFIG.team).station.includes('Red');
            const partner = m.teams.find(t => t.teamNumber != FTC_CONFIG.team && t.station.includes(isRed ? 'Red' : 'Blue'));
            const myS = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
            const oppS = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
            const auto = isRed ? m.scoreRedAuto : m.scoreBlueAuto;
            const win = myS > oppS;
            html += `<tr class="${win ? 'win-row' : 'loss-row'}">
                      <td>${m.description.replace('Qualification ', 'Q')}</td>
                      <td class="${win ? 'win-status' : 'loss-status'}">${win ? 'WIN' : 'LOSS'} ${myS}-${oppS}</td>
                      <td>#${partner.teamNumber}</td>
                      <td class="auto-pts">${auto}</td>
                      <td>${myS - auto}</td>
                      <td class="total-pts">${myS}</td></tr>`;
          });
          html += `</tbody></table>`;
        } else if (isFuture) {
          html += `<div style="padding:20px; color:#888;">[ UPCOMING EVENT ]</div>`;
        }
        
        block.innerHTML = html;
        root.appendChild(block);
      }
    } catch (e) { root.innerHTML = "<div style='text-align:center; padding:20px;'>[ SYNC FAILED ]</div>"; }
  }

  // --- INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
    fetchSeasonTelemetry();
  });
})();
);
    loadCarousel();
    fetchSeasonData(); // Initialize the data engine
  });
})();
      
