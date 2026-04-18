(function () {
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  let scoreTrendChart = null;
  let eventAvgChart = null;
  let ourCachedStats = null;
  let compareRadarChart = null;
  let h2hCharts = [];

  const TEAM_COLORS = ["#0f172a", "#4f46e5", "#dc2626", "#059669"];
  const TEAM_BG     = [
    "rgba(15,23,42,0.35)",
    "rgba(79,70,229,0.3)",
    "rgba(220,38,38,0.3)",
    "rgba(5,150,105,0.3)"
  ];

  let compareTeams = []; // [{number, name, stats}], max 3

  function proxiedFetch(url) {
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
    return fetch(proxyUrl, {
      headers: { Authorization: "Basic " + AUTH_B64 }
    });
  }

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

  function formatPercent(value) {
    return `${round(value, 1)}%`;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function destroyCharts() {
    [scoreTrendChart, eventAvgChart].forEach((chart) => {
      if (chart) chart.destroy();
    });
    scoreTrendChart = null;
    eventAvgChart = null;
  }

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

      // Resolve relative paths so the navbar works from any page/subdirectory
      placeholder.querySelectorAll("img[src]").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("./"))
          img.src = resolveFromRoot(src.slice(2));
      });
      placeholder.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && href.startsWith("./"))
          a.href = resolveFromRoot(href.slice(2));
      });

      window.toggleMenu = () => {
        const menu = placeholder.querySelector(".nav-menu");
        const toggle = placeholder.querySelector(".menu-toggle");
        menu?.classList.toggle("open");
        toggle?.classList.toggle("open");
      };

      // Mobile: tap on dropdown trigger toggles submenu
      placeholder.querySelectorAll(".dropdown > a").forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
          if (window.innerWidth <= 768) {
            e.preventDefault();
            trigger.closest(".dropdown")?.classList.toggle("open");
          }
        });
      });

      // Highlight the active nav link based on current page
      const currentPath = window.location.pathname;
      placeholder.querySelectorAll(".nav-menu a[href]").forEach((a) => {
        const linkPath = new URL(a.href).pathname;
        if (linkPath === currentPath) a.classList.add("active");
      });
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

  async function loadAwards() {
    const awardsRoot = document.getElementById("hero-awards");
    if (!awardsRoot) return;

    try {
      const res = await fetch(resolveFromRoot("awards.json"), {
        cache: "no-cache"
      });
      if (!res.ok) throw new Error(`Awards file returned ${res.status}`);

      const awards = await res.json();

      if (!Array.isArray(awards) || awards.length === 0) {
        awardsRoot.innerHTML = `<div class="hero-award-item">No awards added yet.</div>`;
        return;
      }

      awardsRoot.innerHTML = awards
        .map((item) => {
          const placementText = item.placement ? ` · ${item.placement}` : "";
          return `
            <div class="hero-award-item">
              <div class="hero-award-top">🏆 ${item.award}</div>
              <div class="hero-award-meta">${item.season || ""}</div>
              <div class="hero-award-meta">${item.event}${placementText}</div>
            </div>
          `;
        })
        .join("");
    } catch (err) {
      console.error("Awards error:", err);
      awardsRoot.innerHTML = `<div class="hero-award-item">Unable to load awards right now.</div>`;
    }
  }

  function renderCharts(allMatches, eventSummaries) {
    destroyCharts();

    if (typeof Chart === "undefined") return;

    const labels = allMatches.map((m) => m.chartLabel);
    const scoreValues = allMatches.map((m) => m.myScore);

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
            maxTicksLimit: 6,
            maxRotation: 25,
            minRotation: 25
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

  async function computeTeamStats(teamNumber) {
    const peoriaStats = createStats();
    const stateStats = createStats();
    const allMatches = [];
    const rawMatchRecords = [];
    let bestScoreMatch = null;
    const eventChartSummaries = [];

    const evRes = await proxiedFetch(
      `${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${teamNumber}`
    );
    if (!evRes.ok) throw new Error(`Events API returned ${evRes.status}`);

    const evData = await evRes.json();
    const events = (evData.events || []).sort(
      (a, b) => new Date(a.dateStart) - new Date(b.dateStart)
    );

    if (events.length === 0) {
      throw new Error(`No events found for team ${teamNumber} in the ${FTC_CONFIG.season} season.`);
    }

    for (const event of events) {
      const [mRes, rRes] = await Promise.all([
        proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/matches/${event.code}?teamNumber=${teamNumber}`),
        proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/rankings/${event.code}?teamNumber=${teamNumber}`)
      ]);

      const mData = await mRes.json();

      let eventRank = null;
      try {
        const rData = await rRes.json();
        if (rData.rankings?.[0]) {
          eventRank = rData.rankings[0].rank;
        }
      } catch (err) {
        // ignore missing rankings
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
            (t) => String(t.teamNumber) === String(teamNumber)
          );
          if (!myTeam) return null;

          const isRed = myTeam.station.includes("Red");
          const myScore = isRed ? m.scoreRedFinal : m.scoreBlueFinal;
          const oppScore = isRed ? m.scoreBlueFinal : m.scoreRedFinal;
          const auto = isRed ? m.scoreRedAuto : m.scoreBlueAuto;

          const win = myScore > oppScore;
          const tie = myScore === oppScore;

          if (eventIsState) {
            if (win) stateStats.wins++;
            else if (tie) stateStats.ties++;
            else stateStats.losses++;
          } else if (eventIsPeoria) {
            if (win) peoriaStats.wins++;
            else if (tie) peoriaStats.ties++;
            else peoriaStats.losses++;
          }

          const matchRecord = {
            eventName: event.name,
            label: formatMatchLabel(m.description),
            chartLabel: `${shortEventName(event.name)} ${formatMatchLabel(m.description)}`,
            auto: auto ?? 0,
            myScore,
            oppScore,
            win,
            tie
          };

          allMatches.push(matchRecord);
          rawMatchRecords.push({
            eventCode: event.code,
            eventName: event.name,
            description: m.description,
            redTeams: (m.teams || []).filter(t => t.station.includes("Red")).map(t => +t.teamNumber),
            blueTeams: (m.teams || []).filter(t => t.station.includes("Blue")).map(t => +t.teamNumber),
            redScore: m.scoreRedFinal,
            blueScore: m.scoreBlueFinal,
            myAlliance: isRed ? "red" : "blue",
            myScore,
            oppScore,
            win,
            tie
          });

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
    }

    const totalMatches = allMatches.length;
    const totalWins = allMatches.filter((m) => m.win).length;
    const totalScores = allMatches.map((m) => m.myScore);
    const totalAutos = allMatches.map((m) => m.auto);

    const avgScore = average(totalScores);
    const avgAuto = average(totalAutos);
    const bestScore = totalScores.length ? Math.max(...totalScores) : 0;
    const winRate = totalMatches ? (totalWins / totalMatches) * 100 : 0;

    return {
      avgScore: round(avgScore, 1),
      bestScore,
      bestScoreMatch,
      winRate: round(winRate, 1),
      avgAuto: round(avgAuto, 1),
      peoriaRecord: `${peoriaStats.wins}-${peoriaStats.losses}-${peoriaStats.ties}`,
      stateRecord: `${stateStats.wins}-${stateStats.losses}-${stateStats.ties}`,
      peoriaWins: peoriaStats.wins,
      peoriaTotal: peoriaStats.wins + peoriaStats.losses + peoriaStats.ties,
      stateWins: stateStats.wins,
      stateTotal: stateStats.wins + stateStats.losses + stateStats.ties,
      totalMatches,
      allMatches,
      rawMatches: rawMatchRecords,
      eventChartSummaries,
      peoriaStats,
      stateStats
    };
  }

  async function fetchTelemetry() {
    try {
      const stats = await computeTeamStats(FTC_CONFIG.team);
      ourCachedStats = stats;

      setText("peoria-rank", stats.peoriaStats.rank !== null ? `#${stats.peoriaStats.rank}` : "N/A");
      setText("state-rank", stats.stateStats.rank !== null ? `#${stats.stateStats.rank}` : "N/A");

      setText("avg-score", stats.totalMatches ? `${stats.avgScore}` : "N/A");
      setText("avg-score-card", stats.totalMatches ? `${stats.avgScore}` : "N/A");

      setText("win-rate", stats.totalMatches ? formatPercent(stats.winRate) : "N/A");
      setText("win-rate-card", stats.totalMatches ? formatPercent(stats.winRate) : "N/A");

      setText(
        "best-score",
        stats.bestScoreMatch
          ? `${stats.bestScore} (${shortEventName(stats.bestScoreMatch.eventName)} ${stats.bestScoreMatch.label})`
          : "N/A"
      );

      setText("avg-auto", stats.totalMatches ? `${stats.avgAuto}` : "N/A");
      setText("peoria-record", stats.peoriaRecord);
      setText("state-record", stats.stateRecord);

      renderCharts(stats.allMatches, stats.eventChartSummaries);
    } catch (e) {
      console.error("Telemetry error:", e);
      destroyCharts();

      [
        "peoria-rank",
        "state-rank",
        "avg-score",
        "avg-score-card",
        "win-rate",
        "win-rate-card",
        "best-score",
        "avg-auto",
        "peoria-record",
        "state-record"
      ].forEach((id) => setText(id, "--"));
    }
  }

  // ─── Multi-team compare engine ─────────────────────────────────────────────

  function allCompareTeamStats() {
    return [ourCachedStats, ...compareTeams.map(t => t.stats)];
  }

  function allCompareLabels() {
    return [
      "FBNF · #21592",
      ...compareTeams.map(t => t.name ? `${t.name} · #${t.number}` : `#${t.number}`)
    ];
  }

  function renderSlots() {
    const el = document.getElementById("compare-slots");
    if (!el) return;

    // Our team fixed chip
    let html = `<div class="compare-slot compare-slot--us">FBNF · #21592</div>`;

    for (let i = 0; i < 3; i++) {
      const team = compareTeams[i];
      if (team) {
        const label = team.name ? `${team.name} · #${team.number}` : `#${team.number}`;
        const color = TEAM_COLORS[i + 1];
        html += `<div class="compare-slot compare-slot--filled" style="border-color:${color};color:${color}">
          <span class="slot-label">${label}</span>
          <button class="slot-remove" onclick="removeCompareTeam(${i})" aria-label="Remove">&times;</button>
        </div>`;
      } else {
        html += `<div class="compare-slot compare-slot--empty">+ Slot ${i + 2}</div>`;
      }
    }
    el.innerHTML = html;
  }

  window.removeCompareTeam = function (idx) {
    compareTeams.splice(idx, 1);
    renderSlots();
    if (compareTeams.length === 0) {
      document.getElementById("compare-table").hidden = true;
      if (compareRadarChart) { compareRadarChart.destroy(); compareRadarChart = null; }
      h2hCharts.forEach(c => c.destroy()); h2hCharts = [];
    } else {
      renderCompareTable();
      renderCompareRadar();
    }
  };

  function renderCompareTable() {
    const tableEl = document.getElementById("compare-stats-table");
    if (!tableEl || !ourCachedStats) return;

    const allTeams  = allCompareTeamStats();
    const allLabels = allCompareLabels();
    const n         = allTeams.length;
    const labelFr   = n <= 2 ? "1.6fr" : n === 3 ? "1.4fr" : "1.2fr";
    const colStyle  = `${labelFr} ${Array(n).fill("1fr").join(" ")}`;

    const metrics = [
      {
        label: "Avg Score",
        display: allTeams.map(t => t.totalMatches ? String(t.avgScore) : "N/A"),
        raw:     allTeams.map(t => t.totalMatches ? t.avgScore : null)
      },
      {
        label: "Best Score",
        display: allTeams.map(t => t.bestScore ? String(t.bestScore) : "N/A"),
        raw:     allTeams.map(t => t.bestScore || null)
      },
      {
        label: "Win Rate",
        display: allTeams.map(t => t.totalMatches ? formatPercent(t.winRate) : "N/A"),
        raw:     allTeams.map(t => t.totalMatches ? t.winRate : null)
      },
      {
        label: "Avg Auto",
        display: allTeams.map(t => t.totalMatches ? String(t.avgAuto) : "N/A"),
        raw:     allTeams.map(t => t.totalMatches ? t.avgAuto : null)
      },
      {
        label: "State Record",
        display: allTeams.map(t => t.stateRecord),
        raw:     null
      }
    ];

    // Header
    let html = `<div class="compare-header-row" style="grid-template-columns:${colStyle}">
      <div class="compare-hcell compare-label-col">Stat</div>
      ${allLabels.map((lbl, i) => `
        <div class="compare-hcell compare-val-col">
          <span class="compare-badge" style="background:${TEAM_COLORS[i]};color:#fff;padding:0.25rem 0.65rem;border-radius:99px;font-size:0.75rem;font-weight:800;letter-spacing:0.04em;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${lbl}</span>
        </div>`).join("")}
    </div>`;

    // Data rows
    for (const metric of metrics) {
      const nums    = metric.raw;
      const maxVal  = nums ? Math.max(...nums.filter(v => v != null), -Infinity) : null;

      html += `<div class="compare-row" style="grid-template-columns:${colStyle}">
        <div class="compare-cell compare-label-col">${metric.label}</div>
        ${metric.display.map((disp, i) => {
          let cls = "compare-cell compare-val-col";
          const rawV = nums ? nums[i] : null;
          if (maxVal != null && rawV != null && nums.filter(v => v != null).length > 1) {
            if (rawV === maxVal) cls += " compare-cell--winner";
          }
          return `<div class="${cls}">${disp}</div>`;
        }).join("")}
      </div>`;
    }

    tableEl.innerHTML = html;
  }

  function renderCompareRadar() {
    const radarCtx = document.getElementById("compareRadarChart");
    if (!radarCtx || typeof Chart === "undefined" || !ourCachedStats) return;

    if (compareRadarChart) { compareRadarChart.destroy(); compareRadarChart = null; }

    const allTeams  = allCompareTeamStats();
    const allLabels = allCompareLabels();

    const axisGetters = [
      t => t.totalMatches ? t.avgScore : 0,
      t => t.bestScore || 0,
      t => t.totalMatches ? t.winRate : 0,
      t => t.totalMatches ? t.avgAuto : 0
    ];
    const axisLabels = ["Avg\nScore", "Best\nScore", "Win\nRate", "Avg\nAuto"];

    // Per-axis normalization so all teams fit 0-100
    const normData = allTeams.map(() => []);
    const rawData  = allTeams.map(() => []);

    for (let axis = 0; axis < axisGetters.length; axis++) {
      const vals = allTeams.map(t => axisGetters[axis](t));
      const mx   = Math.max(...vals, 0.001);
      vals.forEach((v, i) => {
        normData[i].push(Math.round((v / mx) * 100));
        rawData[i].push(round(v, 1));
      });
    }

    compareRadarChart = new Chart(radarCtx, {
      type: "radar",
      data: {
        labels: axisLabels,
        datasets: allTeams.map((t, i) => ({
          label: allLabels[i],
          data: normData[i],
          fill: true,
          backgroundColor: TEAM_BG[i],
          borderColor: TEAM_COLORS[i],
          borderWidth: 2.5,
          pointBackgroundColor: TEAM_COLORS[i],
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 9
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { left: 45, right: 45, top: 10, bottom: 10 } },
        animation: { duration: 600, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,23,42,0.97)",
            titleColor: "#f8fafc",
            titleFont: { size: 12, weight: "bold" },
            bodyColor: "#94a3b8",
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: ctx => ctx[0].label.replace("\n", " "),
              label: ctx => {
                const idx = ctx.dataIndex;
                const raw = rawData[ctx.datasetIndex][idx];
                const unit = idx === 2 ? "%" : "";
                return `  ${ctx.dataset.label}: ${raw}${unit}`;
              }
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              display: true,
              stepSize: 25,
              backdropColor: "transparent",
              color: "#9ca3af",
              font: { size: 9 }
            },
            grid: {
              color: "rgba(100,116,139,0.2)",
              lineWidth: 1
            },
            angleLines: {
              color: "rgba(100,116,139,0.25)",
              lineWidth: 1
            },
            pointLabels: {
              color: "#374151",
              font: { size: 11, weight: "700" },
              padding: 20
            }
          }
        }
      }
    });
  }

  function findHeadToHead(rawMatches, otherTeamNumber) {
    const n = +otherTeamNumber;
    return (rawMatches || []).filter(m =>
      m.redTeams.includes(n) || m.blueTeams.includes(n)
    ).map(m => {
      const theyAreRed = m.redTeams.includes(n);
      const sameAlliance = (theyAreRed && m.myAlliance === "red") ||
                           (!theyAreRed && m.myAlliance === "blue");
      return {
        eventName: m.eventName,
        description: m.description,
        sameAlliance,
        ourScore: m.myScore,
        theirScore: theyAreRed ? m.redScore : m.blueScore,
        win: m.win,
        tie: m.tie
      };
    });
  }

  function renderCompareH2H() {
    const h2hEl = document.getElementById("compare-h2h");
    if (!h2hEl || !ourCachedStats?.rawMatches) return;

    h2hCharts.forEach(c => c.destroy());
    h2hCharts = [];

    const sections = compareTeams.map((team, i) => {
      const matches = findHeadToHead(ourCachedStats.rawMatches, team.number);
      if (matches.length === 0) return null;
      const label = team.name ? `${team.name} · #${team.number}` : `#${team.number}`;
      const color = TEAM_COLORS[i + 1];
      const canvasId = `h2h-chart-${i}`;
      const opponentMatches = matches.filter(m => !m.sameAlliance);
      const partnerMatches  = matches.filter(m => m.sameAlliance);
      return { team, i, label, color, canvasId, opponentMatches, partnerMatches };
    }).filter(Boolean);

    if (sections.length === 0) {
      h2hEl.innerHTML = "";
      h2hEl.hidden = true;
      return;
    }

    h2hEl.innerHTML = `<div class="h2h-container">
      <div class="h2h-title">Head to Head</div>
      ${sections.map(s => `
        <div class="h2h-section">
          <div class="h2h-heading">vs <span style="color:${s.color}">${s.label}</span></div>
          ${s.opponentMatches.length > 0 ? `<div class="h2h-chart-wrap"><canvas id="${s.canvasId}"></canvas></div>` : ""}
          ${s.partnerMatches.length > 0 ? `<div class="h2h-partners">Partnered ${s.partnerMatches.length}× · alliance scores: ${s.partnerMatches.map(m => `${shortEventName(m.eventName)} ${formatMatchLabel(m.description)} — ${m.ourScore}`).join(", ")}</div>` : ""}
        </div>
      `).join("")}
    </div>`;
    h2hEl.hidden = false;

    sections.forEach(s => {
      if (s.opponentMatches.length === 0) return;
      const canvas = document.getElementById(s.canvasId);
      if (!canvas) return;

      const chart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: s.opponentMatches.map(m => `${shortEventName(m.eventName)} · ${formatMatchLabel(m.description)}`),
          datasets: [
            {
              label: "FBNF · #21592",
              data: s.opponentMatches.map(m => m.ourScore),
              backgroundColor: TEAM_BG[0],
              borderColor: TEAM_COLORS[0],
              borderWidth: 2,
              borderRadius: 6
            },
            {
              label: s.label,
              data: s.opponentMatches.map(m => m.theirScore),
              backgroundColor: TEAM_BG[s.i + 1],
              borderColor: s.color,
              borderWidth: 2,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: { color: "#6b7280", font: { size: 11, weight: "600" }, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: "rgba(15,23,42,0.95)",
              titleColor: "#f8fafc",
              bodyColor: "#94a3b8",
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: {
              grid: { color: "rgba(148,163,184,0.08)" },
              ticks: { color: "#6b7280", font: { size: 11 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: "rgba(148,163,184,0.08)" },
              ticks: { color: "#6b7280", font: { size: 11 } }
            }
          }
        }
      });
      h2hCharts.push(chart);
    });
  }

  function refreshCompare() {
    if (compareTeams.length === 0) return;
    renderCompareTable();
    renderCompareRadar();
    document.getElementById("compare-table").hidden = false;
  }

  async function handleCompare() {
    const input   = document.getElementById("compare-team-input");
    const btn     = document.getElementById("compare-btn");
    const errorEl = document.getElementById("compare-error");
    const loadingEl = document.getElementById("compare-loading");

    const rawVal     = (input.value || "").trim();
    const teamNumber = parseInt(rawVal, 10);

    if (!rawVal || isNaN(teamNumber) || teamNumber < 1 || teamNumber > 99999) {
      errorEl.textContent = "Please enter a valid FTC team number (1–99999).";
      errorEl.hidden = false;
      return;
    }

    if (compareTeams.length >= 3) {
      errorEl.textContent = "Remove a team slot first to add another.";
      errorEl.hidden = false;
      return;
    }

    if (+teamNumber === +FTC_CONFIG.team) {
      errorEl.textContent = "That's us! Enter a different team number.";
      errorEl.hidden = false;
      return;
    }

    if (compareTeams.some(t => t.number === teamNumber)) {
      errorEl.textContent = `Team ${teamNumber} is already in the comparison.`;
      errorEl.hidden = false;
      return;
    }

    btn.disabled = true;
    errorEl.hidden = true;
    loadingEl.hidden = false;
    loadingEl.textContent = `Fetching stats for team ${teamNumber}…`;

    try {
      const [theirStats, teamName] = await Promise.all([
        computeTeamStats(teamNumber),
        proxiedFetch(`${BASE_URL}/${FTC_CONFIG.season}/teams?teamNumber=${teamNumber}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { const t = d?.teams?.[0]; return t ? t.nameShort || t.nameFull || null : null; })
          .catch(() => null)
      ]);

      loadingEl.hidden = true;

      if (!ourCachedStats) {
        errorEl.textContent = "Our stats haven't loaded yet — please wait a moment and try again.";
        errorEl.hidden = false;
        return;
      }

      compareTeams.push({ number: teamNumber, name: teamName, stats: theirStats });
      input.value = "";
      renderSlots();
      refreshCompare();

    } catch (err) {
      loadingEl.hidden = true;
      errorEl.textContent = `Could not load data for team ${teamNumber}. Check that the number is correct and the team competed in the ${FTC_CONFIG.season} season.`;
      errorEl.hidden = false;
      console.error("Compare error:", err);
    } finally {
      btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectNavbar();
    loadCarousel();
    loadAwards();
    fetchTelemetry();
    renderSlots();

    const compareBtn = document.getElementById("compare-btn");
    if (compareBtn) compareBtn.addEventListener("click", handleCompare);

    const compareInput = document.getElementById("compare-team-input");
    if (compareInput) {
      compareInput.addEventListener("keydown", e => { if (e.key === "Enter") handleCompare(); });
    }
  });
})();