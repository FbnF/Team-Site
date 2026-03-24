(function () {
  // --- 1. CONFIGURATION ---
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  const PROXY = "https://api.allorigins.win/raw?url=";
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  // --- 2. UTILITIES ---
  function getRootUrl() {
    const script = document.querySelector('script[src*="script.js"]');
    return script ? new URL('.', new URL(script.src, window.location.href)).href : './';
  }

  function resolvePath(relPath) {
    return getRootUrl() + relPath.replace(/^\//, '');
  }

  // --- 3. NAVBAR INJECTION ---
  async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    try {
      const res = await fetch(resolvePath('navbar.html'), { cache: 'no-cache' });
      const html = await res.text();
      placeholder.innerHTML = html;

      const base = getRootUrl();
      placeholder.querySelectorAll('[href], [src]').forEach((el) => {
        const attr = el.hasAttribute('href') ? 'href' : 'src';
        const val = el.getAttribute(attr);
        if (val.startsWith('./')) {
          el.setAttribute(attr, new URL(val.replace('./', ''), base).href);
        }
      });
    } catch (err) { console.error('Navbar load failed', err); }
  }

  // --- 4. UPDATES CAROUSEL ---
  async function loadCarousel() {
    const container = document.getElementById('updates');
    if (!container) return;
    try {
      const res = await fetch(resolvePath('updates.json'), { cache: 'no-cache' });
      const items = await res.json();
      
      container.innerHTML = items.map(item => `
        <a href="${resolvePath(item.link)}" class="latest-card">
          <img src="${resolvePath(item.image)}" alt="${item.title}" onerror="this.src='Images/placeholder.jpg'"/>
          <div class="card-caption">${item.date} – ${item.title}</div>
        </a>
      `).join('');

      // Rotation Logic
      let paused = false;
      container.addEventListener('mouseenter', () => paused = true);
      container.addEventListener('mouseleave', () => paused = false);

      setInterval(() => {
        if (paused || window.matchMedia('(max-width: 768px)').matches || document.hidden) return;
        const cards = container.querySelectorAll('.latest-card');
        if (cards.length < 2) return;
        cards[0].classList.add('fade-out');
        setTimeout(() => {
          cards[0].classList.remove('fade-out');
          container.appendChild(cards[0]);
        }, 300);
      }, 3000);
    } catch (err) { console.error('Carousel load failed', err); }
  }

  // --- 5. TELEMETRY ENGINE ---
  async function fetchTelemetry() {
    const root = document.getElementById('season-root');
    if (!root) return;

    try {
      const headers = { 'Authorization': `Basic ${AUTH_B64}` };
      const evUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`);
      const evRes = await fetch(PROXY + evUrl, { headers });
      const evData = await evRes.json();
      
      if (!evData.events || evData.events.length === 0) throw new Error("No events found");
      const events = evData.events.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));

      // Live Stats for Header
      const rUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/rankings/${events[0].code}?teamNumber=${FTC_CONFIG.team}`);
      fetch(PROXY + rUrl, { headers }).then(res => res.json()).then(data => {
        if(data.rankings?.[0]) {
          document.getElementById('live-rank').innerText = `#${data.rankings[0].rank}`;
          document.getElementById('live-record').innerText = `${data.rankings[0].wins}-${data.rankings[0].losses}-${data.rankings[0].ties}`;
        }
      });

      root.innerHTML = ""; 

      for (const event of events) {
        const mUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`);
        const aUrl = encodeURIComponent(`${BASE_URL}/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`);
        
        const [mRes, aRes] = await Promise.all([fetch(PROXY + mUrl, { headers }), fetch(PROXY + aUrl, { headers })]);
        const mData = await mRes.json();
        const aData = await aRes.json();

        const block = document.createElement('div');
        block.className = "event-block";
        let html = `<div class="event-header"><div class="event-info"><h3>${event.name}</h3>
                    <span class="event-date">${new Date(event.dateStart).toLocaleDateString()} | ${event.venue}</span></div></div>`;

        if (aData.awards?.length > 0) {
          html += `<div class="awards-ribbon">` + aData.awards.map(a => `<span class="award-tag">🏆 ${a.name}</span>`).join('') + `</div>`;
        }

        if (mData.matches?.length > 0) {
          html += `<table class="match-table"><thead><tr><th>Match</th><th>Result</th><th>Partner</th><th>Auto</th><th>Total</th></tr></thead><tbody>`;
          mData.matches.forEach(m => {
            if (m.scoreRedFinal === null) return;
            const myTeam = m.teams.find(t => t.teamNumber == FTC_CONFIG.team);
            const isRed = myTeam.station.includes('Red');
            const partner = m.teams.find(t => t.teamNumber != FTC_CONFIG.team && t.station.includes(isRed ? 'Red' : 'Blue'));
            const myS = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
            const oppS = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
            const win = myS > oppS;
            html += `<tr class="${win ? 'win-row' : 'loss-row'}">
                      <td>${m.description.replace('Qualification ', 'Q')}</td>
                      <td class="${win ? 'win-status' : 'loss-status'}">${win ? 'WIN' : 'LOSS'} ${myS}-${oppS}</td>
                      <td>#${partner ? partner.teamNumber : 'N/A'}</td>
                      <td class="auto-pts">${isRed ? m.scoreRedAuto : m.scoreBlueAuto}</td>
                      <td class="total-pts">${myS}</td></tr>`;
          });
          html += `</tbody></table>`;
        }
        block.innerHTML = html;
        root.appendChild(block);
      }
    } catch (e) { 
      console.error(e);
      root.innerHTML = "<div style='text-align:center; padding:50px;'>[ DATA SYNC OFFLINE ]</div>"; 
    }
  }

  // --- INITIALIZE ---
  window.addEventListener('load', () => {
    injectNavbar();
    loadCarousel();
    fetchTelemetr
      y();
  });
})();
