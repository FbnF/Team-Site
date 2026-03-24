(function () {
  // --- CONFIGURATION ---
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  // Using a more reliable CORS proxy for mobile/Firefox
  const PROXY = "https://corsproxy.io/?"; 
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  // --- UTILITIES (Fixed for Images) ---
  function getScriptUrl() {
    const scripts = document.getElementsByTagName('script');
    const thisScript = document.currentScript || Array.from(scripts).find((s) => (s.src || '').includes('script.js'));
    return thisScript ? new URL(thisScript.src) : null;
  }

  function resolveFromRoot(relPath) {
    const url = getScriptUrl();
    if (!url) return relPath;
    // This ensures images load correctly even on GitHub Pages subfolders
    const base = new URL('.', url);
    return new URL(relPath, base).href;
  }

  // --- NAVBAR INJECTION ---
  async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    try {
      const res = await fetch(resolveFromRoot('navbar.html'));
      const html = await res.text();
      placeholder.innerHTML = html;
      window.toggleMenu = () => {
        const menu = placeholder.querySelector('.nav-menu');
        menu.classList.toggle('open');
      };
    } catch (err) { console.error('Navbar error:', err); }
  }

  // --- UPDATES CAROUSEL ---
  async function loadCarousel() {
    const container = document.getElementById('updates');
    if (!container) return;
    try {
      const res = await fetch(resolveFromRoot('updates.json'), { cache: 'no-cache' });
      const items = await res.json();
      container.innerHTML = items.map(item => `
        <a href="${resolveFromRoot(item.link)}" class="latest-card">
          <img src="${resolveFromRoot(item.image)}" alt="${item.title}" onerror="this.src='Images/placeholder.jpg'"/>
          <div class="card-caption">${item.date} – ${item.title}</div>
        </a>
      `).join('');
    } catch (err) { console.error('Carousel error:', err); }
  }

  // --- TELEMETRY ENGINE (Fixed for Firefox/Mobile) ---
  async function fetchSeasonTelemetry() {
    const root = document.getElementById('season-root');
    if (!root) return;

    try {
      const fetchHeaders = { 'Authorization': `Basic ${AUTH_B64}`, 'Accept': 'application/json' };
      
      // Request 1: Events
      const evUrl = `${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`;
      const evRes = await fetch(PROXY + encodeURIComponent(evUrl), { headers: fetchHeaders });
      const evData = await evRes.json();
      const events = evData.events.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));

      root.innerHTML = ""; 

      for (const event of events) {
        const block = document.createElement('div');
        block.className = "event-block";

        const mUrl = `${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`;
        const aUrl = `${BASE_URL}/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`;

        const [mRes, aRes] = await Promise.all([
          fetch(PROXY + encodeURIComponent(mUrl), { headers: fetchHeaders }),
          fetch(PROXY + encodeURIComponent(aUrl), { headers: fetchHeaders })
        ]);

        const mData = await mRes.json();
        const aData = await aRes.json();

        // Populate Top Bar Rank if this is the latest event
        if (event === events[0]) {
           const rUrl = `${BASE_URL}/${FTC_CONFIG.season}/rankings/${event.code}?teamNumber=${FTC_CONFIG.team}`;
           const rRes = await fetch(PROXY + encodeURIComponent(rUrl), { headers: fetchHeaders });
           const rData = await rRes.json();
           if(rData.rankings?.[0]) {
               document.getElementById('live-rank').innerText = `#${rData.rankings[0].rank}`;
               document.getElementById('live-record').innerText = `${rData.rankings[0].wins}-${rData.rankings[0].losses}-${rData.rankings[0].ties}`;
           }
        }

        let html = `<div class="event-header"><div class="event-info"><h3>${event.name}</h3>
                    <span class="event-date">${new Date(event.dateStart).toLocaleDateString()}</span></div></div>`;

        if (aData.awards?.length > 0) {
          html += `<div class="awards-ribbon">` + aData.awards.map(a => `<span class="award-tag">🏆 ${a.name}</span>`).join('') + `</div>`;
        }

        if (mData.matches?.length > 0) {
          html += `<table class="match-table"><thead><tr><th>Match</th><th>Result</th><th>Partner</th><th>Auto</th><th>Total</th></tr></thead><tbody>`;
          mData.matches.forEach(m => {
            if (m.scoreRedFinal === null) return;
            const isRed = m.teams.find(t => t.teamNumber == FTC_CONFIG.team).station.includes('Red');
            const partner = m.teams.find(t => t.teamNumber != FTC_CONFIG.team && t.station.includes(isRed ? 'Red' : 'Blue'));
            const myS = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
            const oppS = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
            const win = myS > oppS;
            html += `<tr class="${win ? 'win-row' : 'loss-row'}">
                      <td>${m.description.replace('Qualification ', 'Q')}</td>
                      <td class="${win ? 'win-status' : 'loss-status'}">${win ? 'WIN' : 'LOSS'} ${myS}-${oppS}</td>
                      <td>#${partner.teamNumber}</td>
                      <td class="auto-pts">${isRed ? m.scoreRedAuto : m.scoreBlueAuto}</td>
                      <td class="total-pts">${myS}</td></tr>`;
          });
          html += `</tbody></table>`;
        }
        block.innerHTML = html;
        root.appendChild(block);
      }
    } catch (e) { 
        root.innerHTML = "<div style='text-align:center; padding:20px;'>[ DATA OFFLINE: REFRESH OR CHECK CONNECTION ]</div>"; 
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
    fetchSeasonTelemetr
      y();
  });
})();
