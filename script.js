(function () {
  // --- 1. CONFIGURATION ---
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  // --- 2. CORS PROXY ---
  function proxiedFetch(url) {
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    return fetch(proxyUrl, {
      headers: { "Authorization": "Basic " + AUTH_B64 }
    });
  }

  // --- 3. UTILITIES ---
  function getScriptUrl() {
    const scripts = document.getElementsByTagName('script');
    const thisScript = document.currentScript || Array.from(scripts).find((s) => (s.src || '').includes('script.js'));
    return thisScript ? new URL(thisScript.src) : null;
  }

  function resolveFromRoot(relPath) {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) return relPath;
    return new URL(relPath, new URL('.', scriptUrl)).href;
  }

  // --- 4. NAVBAR & CAROUSEL ---
  async function injectNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    const scriptUrl = getScriptUrl();
    try {
      const res = await fetch(new URL('navbar.html', scriptUrl).href, { cache: 'no-cache' });
      const html = await res.text();
      placeholder.innerHTML = html;
      window.toggleMenu = () => placeholder.querySelector('.nav-menu')?.classList.toggle('open');
    } catch (err) { console.error('Navbar error:', err); }
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
        </a>`).join('');
      startStackCarousel(container);
    } catch (err) { console.error('Carousel error:', err); }
  }

  function startStackCarousel(container) {
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
  }

  // --- 5. TELEMETRY ENGINE ---
  async function fetchTelemetry() {
    const root = document.getElementById('season-root');
    if (!root) return;

    // Season-wide W-L-T tallied from all match results
    let totalWins = 0, totalLosses = 0, totalTies = 0;
    // Best rank found (lowest number = best, from most recent event with data)
    let bestRank = null;
    let bestRankEvent = null;

    try {
      // Fetch events for this team
      const evRes = await proxiedFetch(
        `${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`
      );
      if (!evRes.ok) throw new Error(`Events API returned ${evRes.status}`);
      const evData = await evRes.json();
      const events = evData.events.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));

      // Build event blocks
      root.innerHTML = "";
      for (const event of events) {
        const block = document.createElement('div');
        block.className = "event-block";

        // Fetch matches, awards, and rankings for this event in parallel
        const [mRes, aRes, rRes] = await Promise.all([
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`),
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`),
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/rankings/${event.code}?teamNumber=${FTC_CONFIG.team}`)
        ]);
        const mData = await mRes.json();
        const aData = await aRes.json();

        // Try to get rank for this event
        let eventRank = null;
        try {
          const rData = await rRes.json();
          if (rData.rankings?.[0]) {
            eventRank = rData.rankings[0].rank;
            // Track the best (most recent) rank for the hero bar
            if (bestRank === null) {
              bestRank = eventRank;
              bestRankEvent = event.name;
            }
          }
        } catch (err) { /* rankings not available for this event */ }

        // Event header — show rank if available
        let headerRight = new Date(event.dateStart).toLocaleDateString();
        if (eventRank !== null) {
          headerRight = `Rank #${eventRank} · ${headerRight}`;
        }
        let html = `<div class="event-header"><h3>${event.name}</h3><span>${headerRight}</span></div>`;

        if (aData.awards?.length > 0) {
          html += `<div class="awards-ribbon">` + aData.awards.map(a => `<span class="award-tag">🏆 ${a.name}</span>`).join('') + `</div>`;
        }
        if (mData.matches?.length > 0) {
          html += `<table class="match-table"><thead><tr><th>Match</th><th>Result</th><th>Partner</th><th>Auto</th><th>Total</th></tr></thead><tbody>`;
          mData.matches.forEach(m => {
            if (m.scoreRedFinal === null) return;
            const myTeam = m.teams.find(t => t.teamNumber == FTC_CONFIG.team);
            if (!myTeam) return;
            const isRed = myTeam.station.includes('Red');
            const partner = m.teams.find(t => t.teamNumber != FTC_CONFIG.team && t.station.includes(isRed ? 'Red' : 'Blue'));
            const myS = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
            const oppS = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
            const win = myS > oppS;
            const tie = myS === oppS;

            // Tally season W-L-T
            if (win) totalWins++;
            else if (tie) totalTies++;
            else totalLosses++;

            html += `<tr class="${win ? 'win-row' : 'loss-row'}">
              <td>${m.description.replace('Qualification ', 'Q')}</td>
              <td class="${win ? 'win-status' : 'loss-status'}">${win ? 'WIN' : 'LOSS'} ${myS}-${oppS}</td>
              <td>#${partner?.teamNumber || '??'}</td>
              <td class="auto-pts">${isRed ? m.scoreRedAuto : m.scoreBlueAuto}</td>
              <td class="total-pts">${myS}</td></tr>`;
          });
          html += `</tbody></table>`;
        }
        block.innerHTML = html;
        root.appendChild(block);
      }

      // Update hero stats bar
      if (bestRank !== null) {
        document.getElementById('live-rank').innerText = `#${bestRank}`;
      } else {
        document.getElementById('live-rank').innerText = 'N/A';
      }
      if (totalWins + totalLosses + totalTies > 0) {
        document.getElementById('live-record').innerText = `${totalWins}-${totalLosses}-${totalTies}`;
      }

    } catch (e) {
      console.error('Telemetry error:', e);
      root.innerHTML = "<div style='text-align:center; padding:20px; color:#c00; font-family:monospace;'>[ DATA SYNC FAILED — check console for details ]</div>";
    }
  }

  // --- 6. INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    loadCarousel();
    fetchTelemetry();
  });
})();
