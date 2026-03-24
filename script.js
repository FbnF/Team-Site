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
  const CLOSE_MATCH_MARGIN = 20;
  const MIN_PARTNER_MATCHES = 2;

  let scoreTrendChart = null;
  let autoTrendChart = null;
  let foulTrendChart = null;
  let eventAvgChart = null;

  // --- 2. CORS PROXY ---
  function proxiedFetch(url) {
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    return fetch(proxyUrl, {
      headers: { Authorization: "Basic " + AUTH_B64 }
    });
  }

  // --- 3. UTILITIES ---
  function getScriptUrl() {
    const scripts = document.getElementsByTagName("script");
    const thisScript =
      document.currentScript ||
      Array.from(scripts).find((s) => (s.src || "").includes("script.js"));
    return thisScript ? new URL(thisScript.src) : null;
  }

  function resolveFromRoot(relPath) {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) return relPath;
    return new URL(relPath, new URL(".", scriptUrl)).href;
  }

  function createStats() {
    return {
      wins: 0,
      losses: 0,
      ties: 0,
      rank: null
    };
  }

  function isStateEvent(eventName) {
    const name = (eventName || "").toLowerCase();
    return name.includes("illinois championship");
  }

  function isPeoriaEvent(eventName) {
    const name = (eventName || "").toLowerCase();
    return (
      name.includes("peoria meet") ||
      name.includes("peoria western league tournament")
    );
  }

  function isQualificationMatch(match) {
    const desc = (match.description || "").toLowerCase();
    return desc.includes("qualification");
  }

  function formatMatchLabel(description) {
    return (description || "").replace("Qualification ", "Q");
  }

  function shortEventName(eventName) {
    const name = (eventName || "").toLowerCase();

    if (name.includes("solomon division")) return "State";
    if (name.includes("illinois championship")) return "State";
    if (name.includes("peoria western league tournament")) return "PWLT";
    if (name.includes("peoria meet 1")) return "Meet 1";
    if (name.includes("peoria meet 2")) return "Meet 2";
    if (name.includes("peoria meet 3")) return "Meet 3";
    if (name.includes("peoria meet 4")) return "Meet 4";

    return eventName.length > 12 ? eventName.slice(0, 12) : eventName;
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  function round(value, digits = 0) {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  function standardDeviation(values) {
    if (!values.length) return 0;
    const avg = average(values);
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  function formatPercent(value) {
    return `${round(value, 1)}%`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function safeDate(dateString) {
    const d = new Date(dateString);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatEventDate(dateString) {
    const d = safeDate(dateString);
    return d ? d.toLocaleDateString() : "Unknown date";
  }

  function destroyCharts() {
    [scoreTrendChart, autoTrendChart, foulTrendChart, eventAvgChart].forEach((chart) => {
      if (chart) chart.destroy();
    });
    scoreTrendChart = null;
    autoTrendChart = null;
    foulTrendChart = null;
    eventAvgChart = null;
  }

  function consistencyLabel(stdDev) {
    if (stdDev <= 15) return `High (scores vary by ~${round(stdDev)} pts)`;
    if (stdDev <= 30) return `Medium (scores vary by ~${round(stdDev)} pts)`;
    return `Low (scores vary by ~${round(stdDev)} pts)`;
  }

  // --- 4. NAVBAR & CAROUSEL ---
  async function injectNavbar() {
    const placeholder = document.getElementById("navbar-placeholder");
    if (!placeholder) return;

    const scriptUrl = getScriptUrl();
    try {
      const res = await fetch(new URL("navbar.html", scriptUrl).href, {
        cache: "no-cache"
      });
      const html = await res.text();
      placeholder.innerHTML = html;
      window.toggleMenu = () =>
        placeholder.querySelector(".nav-menu")?.classList.toggle("open");
    } catch (err) {
      console.error("Navbar error:", err);
    }
  }

  async function loadCarousel() {
    const container = document.getElementById("updates");
    if (!container) return;

    try {
      const res = await fetch(resolveFromRoot("updates.json"), {
        cache: "no-cache"
      });
      const items = await res.json();

      container.innerHTML = items
        .map(
          (item) => `
        <a href="${resolveFromRoot(item.link)}" class="latest-card">
          <img src="${resolveFromRoot(item.image)}" alt="${item.title}" />
          <div class="card-caption">${item.date} – ${item.title}</div>
        </a>`
        )
        .join("");

      startStackCarousel(container);
    } catch (err) {
      console.error("Carousel error:", err);
    }
  }

  function startStackCarousel(container) {
    let paused = false;

    container.addEventListener("mouseenter", () => {
      paused = true;
    });

    container.addEventListener("mouseleave", () => {
      paused = false;
    });

    setInterval(() => {
      if (
        paused ||
        window.matchMedia("(max-width: 768px)").matches ||
        document.hidden
      ) {
        return;
      }

      const cards = container.querySelectorAll(".latest-card");
      if (cards.length < 2) return;

      cards[0].classList.add("fade-out");

      setTimeout(() => {
        cards[0].classList.remove("fade-out");
        container.appendChild(cards[0]);
      }, 300);
    }, 3000);
  }

  // --- 5. RENDER HELPERS ---
  function buildEventBlock(event, eventRank, awards, qualificationMatches, isOpen) {
    const headerMeta = `${formatEventDate(event.dateStart)}${event.code ? ` · ${event.code}` : ""}`;
    const rankPill = eventRank !== null
      ? `<span class="event-rank-pill">Rank #${eventRank}</span>`
      : "";

    let contentHtml = "";

    if (awards?.length > 0) {
      contentHtml +=
        `<div class="awards-ribbon">` +
        awards.map((a) => `<span class="award-tag">🏆 ${a.name}</span>`).join("") +
        `</div>`;
    }

    if (qualificationMatches.length > 0) {
      contentHtml += `
        <div class="match-table-wrap">
          <table class="match-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Result</th>
                <th>Partner</th>
                <th>Auto</th>
                <th>Foul</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
      `;

      qualificationMatches.forEach((m) => {
        const rowClass = m.win ? "win-row" : m.tie ? "tie-row" : "loss-row";
        const statusClass = m.win ? "win-status" : m.tie ? "tie-status" : "loss-status";
        const statusText = m.win ? "WIN" : m.tie ? "TIE" : "LOSS";

        contentHtml += `
          <tr class="${rowClass}">
            <td>${m.label}</td>
            <td class="${statusClass}">${statusText} ${m.myScore}-${m.oppScore}</td>
            <td>#${m.partnerTeam || "??"}</td>
            <td class="auto-pts">${m.auto}</td>
            <td>${m.foul}</td>
            <td class="total-pts">${m.myScore}</td>
          </tr>
        `;
      });

      contentHtml += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      contentHtml += `<div class="empty-event-note">No qualification matches available for this event.</div>`;
    }

    return `
      <div class="event-block">
        <details class="event-details" ${isOpen ? "open" : ""}>
          <summary class="event-summary">
            <div class="event-summary-left">
              <h3>${event.name}</h3>
              <div class="event-summary-meta">${headerMeta}</div>
            </div>
            <div class="event-summary-right">
              ${rankPill}
              <span class="event-toggle-icon">⌄</span>
            </div>
          </summary>
          <div class="event-content">
            ${contentHtml}
          </div>
        </details>
      </div>
    `;
  }

  function renderSummaryCards(summary) {
    setText("avg-score", summary.avgScoreText);
    setText("best-score", summary.bestScoreText);
    setText("avg-auto", summary.avgAutoText);
    setText("avg-foul", summary.avgFoulText);
    setText("win-rate", summary.winRateText);
    setText("auto-contribution", summary.autoContributionText);
    setText("close-record", summary.closeRecordText);
    setText("consistency", summary.consistencyText);
    setText("best-partner", summary.bestPartnerText);
    setText("penalty-impact", summary.penaltyImpactText);
    setText("peoria-avg", summary.peoriaAvgText);
    setText("state-avg", summary.stateAvgText);
  }

  function renderCharts(allMatches, eventSummaries) {
    destroyCharts();

    if (typeof Chart === "undefined") return;

    const labels = allMatches.map((m) => m.chartLabel);
    const scoreValues = allMatches.map((m) => m.myScore);
    const autoValues = allMatches.map((m) => m.auto);
    const foulValues = allMatches.map((m) => m.foul);

    const eventLabels = eventSummaries.map((e) => e.shortName);
    const eventAvgValues = eventSummaries.map((e) => round(e.avgScore, 1));

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
            maxRotation: 35,
            minRotation: 35
          }
        },
        y: {
          beginAtZero: true
        }
      }
    };

    const scoreCtx = document.getElementById("scoreTrendChart");
    if (scoreCtx) {
      scoreTrendChart = new Chart(scoreCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Total Score",
              data: scoreValues,
              tension: 0.25
            }
          ]
        },
        options: commonOptions
      });
    }

    const autoCtx = document.getElementById("autoTrendChart");
    if (autoCtx) {
      autoTrendChart = new Chart(autoCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Auto Points",
              data: autoValues,
              tension: 0.25
            }
          ]
        },
        options: commonOptions
      });
    }

    const foulCtx = document.getElementById("foulTrendChart");
    if (foulCtx) {
      foulTrendChart = new Chart(foulCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Foul Points",
              data: foulValues,
              tension: 0.25
            }
          ]
        },
        options: commonOptions
      });
    }

    const eventAvgCtx = document.getElementById("eventAvgChart");
    if (eventAvgCtx) {
      eventAvgChart = new Chart(eventAvgCtx, {
        type: "bar",
        data: {
          labels: eventLabels,
          datasets: [
            {
              label: "Average Score",
              data: eventAvgValues
            }
          ]
        },
        options: commonOptions
      });
    }
  }

  // --- 6. TELEMETRY ENGINE ---
  async function fetchTelemetry() {
    const root = document.getElementById("season-root");
    if (!root) return;

    const peoriaStats = createStats();
    const stateStats = createStats();

    const allMatches = [];
    const peoriaScores = [];
    const stateScores = [];
    const partnerMap = new Map();
    let closeWins = 0;
    let closeLosses = 0;
    let foulSwingMatches = 0;
    let bestScoreMatch = null;

    try {
      const evRes = await proxiedFetch(
        `${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`
      );
      if (!evRes.ok) throw new Error(`Events API returned ${evRes.status}`);

      const evData = await evRes.json();
      const events = (evData.events || []).sort(
        (a, b) => new Date(b.dateStart) - new Date(a.dateStart)
      );

      root.innerHTML = "";

      const renderedEvents = [];
      const eventChartSummaries = [];

      for (let i = 0; i < events.length; i++) {
        const event = events[i];

        const [mRes, aRes, rRes] = await Promise.all([
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${FTC_CONFIG.team}`),
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/awards/${event.code}/${FTC_CONFIG.team}`),
          proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/rankings/${event.code}?teamNumber=${FTC_CONFIG.team}`)
        ]);

        const mData = await mRes.json();
        const aData = await aRes.json();

        let eventRank = null;
        try {
          const rData = await rRes.json();
          if (rData.rankings?.[0]) {
            eventRank = rData.rankings[0].rank;
          }
        } catch (err) {
          // rankings may not exist
        }

        const eventName = event.name || "";
        const eventIsState = isStateEvent(eventName);
        const eventIsPeoria = isPeoriaEvent(eventName);

        if (eventIsState && eventRank !== null && stateStats.rank === null) {
          stateStats.rank = eventRank;
        }

        if (eventIsPeoria && eventRank !== null && peoriaStats.rank === null) {
          peoriaStats.rank = eventRank;
        }

        const qualificationMatches = (mData.matches || [])
          .filter((m) => {
            if (m.scoreRedFinal === null || m.scoreBlueFinal === null) return false;
            return isQualificationMatch(m);
          })
          .map((m) => {
            const myTeam = (m.teams || []).find(
              (t) => String(t.teamNumber) === String(FTC_CONFIG.team)
            );
            if (!myTeam) return null;

            const isRed = myTeam.station.includes("Red");
            const partner = (m.teams || []).find(
              (t) =>
                String(t.teamNumber) !== String(FTC_CONFIG.team) &&
                t.station.includes(isRed ? "Red" : "Blue")
            );

            const auto = isRed ? m.scoreRedAuto : m.scoreBlueAuto;
            const foul = isRed ? m.scoreRedFoul : m.scoreBlueFoul;
            const myScore = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
            const oppScore = isRed ? m.scoreBlueFinal : m.scoreRedFinal;

            const win = myScore > oppScore;
            const tie = myScore === oppScore;
            const loss = myScore < oppScore;
            const margin = Math.abs(myScore - oppScore);
            const partnerTeam = partner?.teamNumber || null;

            if (eventIsState) {
              if (win) stateStats.wins++;
              else if (tie) stateStats.ties++;
              else stateStats.losses++;
              stateScores.push(myScore);
            } else if (eventIsPeoria) {
              if (win) peoriaStats.wins++;
              else if (tie) peoriaStats.ties++;
              else peoriaStats.losses++;
              peoriaScores.push(myScore);
            }

            if (partnerTeam) {
              const prev = partnerMap.get(String(partnerTeam)) || {
                matches: 0,
                wins: 0
              };
              prev.matches += 1;
              if (win) prev.wins += 1;
              partnerMap.set(String(partnerTeam), prev);
            }

            if (!tie && margin <= CLOSE_MATCH_MARGIN) {
              if (win) closeWins++;
              else closeLosses++;
            }

            if (loss && foul >= margin) {
              foulSwingMatches++;
            }

            const matchRecord = {
              eventName: event.name,
              eventShortName: shortEventName(event.name),
              label: formatMatchLabel(m.description),
              chartLabel: `${shortEventName(event.name)} ${formatMatchLabel(m.description)}`,
              partnerTeam,
              auto: auto ?? 0,
              foul: foul ?? 0,
              myScore,
              oppScore,
              win,
              tie,
              loss
            };

            allMatches.push(matchRecord);

            if (!bestScoreMatch || myScore > bestScoreMatch.myScore) {
              bestScoreMatch = matchRecord;
            }

            return matchRecord;
          })
          .filter(Boolean);

        const eventAvgScore = average(qualificationMatches.map((m) => m.myScore));
        eventChartSummaries.push({
          name: event.name,
          shortName: shortEventName(event.name),
          avgScore: eventAvgScore || 0
        });

        renderedEvents.push(
          buildEventBlock(
            event,
            eventRank,
            aData.awards || [],
            qualificationMatches,
            i === 0
          )
        );
      }

      root.innerHTML = renderedEvents.join("");

      // --- Top hero stats ---
      setText("peoria-rank", peoriaStats.rank !== null ? `#${peoriaStats.rank}` : "N/A");
      setText("peoria-record", `${peoriaStats.wins}-${peoriaStats.losses}-${peoriaStats.ties}`);
      setText("state-rank", stateStats.rank !== null ? `#${stateStats.rank}` : "N/A");
      setText("state-record", `${stateStats.wins}-${stateStats.losses}-${stateStats.ties}`);

      // --- Summary calculations ---
      const totalMatches = allMatches.length;
      const totalWins = allMatches.filter((m) => m.win).length;
      const totalScores = allMatches.map((m) => m.myScore);
      const totalAutos = allMatches.map((m) => m.auto);
      const totalFouls = allMatches.map((m) => m.foul);

      const avgScore = average(totalScores);
      const avgAuto = average(totalAutos);
      const avgFoul = average(totalFouls);
      const bestScore = totalScores.length ? Math.max(...totalScores) : 0;
      const winRate = totalMatches ? (totalWins / totalMatches) * 100 : 0;
      const autoContribution = avgScore ? (avgAuto / avgScore) * 100 : 0;
      const consistency = standardDeviation(totalScores);

      let bestPartnerText = "Not enough repeat pairings";
      let bestPartner = null;

      for (const [teamNumber, stats] of partnerMap.entries()) {
        if (stats.matches < MIN_PARTNER_MATCHES) continue;
        const rate = stats.wins / stats.matches;
        if (
          !bestPartner ||
          rate > bestPartner.rate ||
          (rate === bestPartner.rate && stats.matches > bestPartner.matches)
        ) {
          bestPartner = {
            teamNumber,
            matches: stats.matches,
            wins: stats.wins,
            rate
          };
        }
      }

      if (bestPartner) {
        bestPartnerText = `#${bestPartner.teamNumber} · ${formatPercent(bestPartner.rate * 100)} over ${bestPartner.matches} matches`;
      }

      const summary = {
        avgScoreText: totalMatches ? `${round(avgScore, 1)}` : "N/A",
        bestScoreText: bestScoreMatch
          ? `${bestScore} (${shortEventName(bestScoreMatch.eventName)} ${bestScoreMatch.label})`
          : "N/A",
        avgAutoText: totalMatches ? `${round(avgAuto, 1)}` : "N/A",
        avgFoulText: totalMatches ? `${round(avgFoul, 1)}` : "N/A",
        winRateText: totalMatches ? formatPercent(winRate) : "N/A",
        autoContributionText: totalMatches ? `${formatPercent(autoContribution)} of score` : "N/A",
        closeRecordText: `${closeWins} wins, ${closeLosses} losses`,
        consistencyText: totalMatches ? consistencyLabel(consistency) : "N/A",
        bestPartnerText,
        penaltyImpactText: `${foulSwingMatches} losses where fouls exceeded margin`,
        peoriaAvgText: peoriaScores.length ? `${round(average(peoriaScores), 1)}` : "N/A",
        stateAvgText: stateScores.length ? `${round(average(stateScores), 1)}` : "N/A"
      };

      renderSummaryCards(summary);
      renderCharts(allMatches, eventChartSummaries);
    } catch (e) {
      console.error("Telemetry error:", e);
      destroyCharts();
      root.innerHTML =
        "<div style='text-align:center; padding:20px; color:#c00; font-family:monospace;'>[ DATA SYNC FAILED — check console for details ]</div>";

      [
        "avg-score",
        "best-score",
        "avg-auto",
        "avg-foul",
        "win-rate",
        "auto-contribution",
        "close-record",
        "consistency",
        "best-partner",
        "penalty-impact",
        "peoria-avg",
        "state-avg",
        "peoria-rank",
        "peoria-record",
        "state-rank",
        "state-record"
      ].forEach((id) => setText(id, "--"));
    }
  }

  // --- 7. INIT ---
  document.addEventListener("DOMContentLoaded", () => {
    injectNavbar();
    loadCarousel();
    fetchTelemetry();
  });
})();
