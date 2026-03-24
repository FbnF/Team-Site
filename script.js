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

        let headerHtml = `
          <div class="event-header">
            <div class="event-info">
              <h3>${event.name}</h3>
              <span class="event-date">${eventDate.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})} | ${event.venue}</span>
            </div>
        `;
        
        if (isFuture) {
          const days = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
          headerHtml += `<div class="next-match-pill">T-MINUS ${days} DAYS</div>`;
        }
        headerHtml += `</div>`;
        block.innerHTML = headerHtml;

        if (!isFuture) {
          // 2. Fetch Awards
          const awRes = await fetch(`https://ftc-api.firstinspires.org/v2.0/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`, { headers });
          const awData = await awRes.json();
          if (awData.awards && awData.awards.length > 0) {
            const ribbon = document.createElement('div');
            ribbon.className = 'awards-ribbon';
            awData.awards.forEach(a => ribbon.innerHTML += `<span class="award-tag">🏆 ${a.name}</span>`);
            block.appendChild(ribbon);
          }

          // 3. Fetch Matches & Populate Live Bar (Most Recent Event)
          const mRes = await fetch(`https://ftc-api.firstinspires.org/v2.0/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`, { headers });
          const mData = await mRes.json();

          if (event === events[0]) {
             const rRes = await fetch(`https://ftc-api.firstinspires.org/v2.0/${FTC_CONFIG.season}/rankings/${event.code}?teamNumber=${FTC_CONFIG.team}`, { headers });
             const rData = await rRes.json();
             if(rData.rankings && rData.rankings[0]) {
                 const stats = rData.rankings[0];
                 document.getElementById('live-rank').innerText = `#${stats.rank}`;
                 document.getElementById('live-record').innerText = `${stats.wins}-${stats.losses}-${stats.ties}`;
             }
          }

          if (mData.matches && mData.matches.length > 0) {
            let table = `<table class="match-table"><thead><tr><th>Match</th><th>Result</th><th>Partner</th><th>Auto</th><th>Tele+End</th><th>Total</th></tr></thead><tbody>`;
            
            for (const m of mData.matches) {
              if (m.scoreRedFinal === null) continue;
              const isRed = m.teams.find(t => t.teamNumber == FTC_CONFIG.team).station.includes('Red');
              const partner = m.teams.find(t => t.teamNumber != FTC_CONFIG.team && t.station.includes(isRed ? 'Red' : 'Blue'));
              const myScore = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
              const oppScore = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
              const auto = isRed ? m.scoreRedAuto : m.scoreBlueAuto;
              const win = myScore > oppScore;

              table += `
                <tr class="${win ? 'win-row' : 'loss-row'}">
                  <td>${m.description.replace('Qualification ', 'Q')}</td>
                  <td class="${win ? 'win-status' : 'loss-status'}">${win ? 'WIN' : 'LOSS'} ${myScore}-${oppScore}</td>
                  <td>#${partner.teamNumber}</td>
                  <td class="auto-pts">${auto}</td>
                  <td>${myScore - auto}</td>
                  <td class="total-pts">${myScore}</td>
                </tr>`;
            }
            table += `</tbody></table>`;
            block.innerHTML += table;
          }
        }
        root.appendChild(block);
      }
    } catch (e) {
      console.error("Telemetry Stream Error:", e);
    }
  }

  // --- INITIALIZE ALL ---
  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
    fetchSeasonData(); // Initialize the data engine
  });
})();
      
