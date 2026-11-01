const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(require.resolve("../script.js"), "utf8");

function loadStatistics(responses, date = "2026-11-01T19:00:00Z") {
  const requests = [];
  const elements = new Map();
  function element(tagName) {
    return {
      tagName, textContent: "", children: [],
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      replaceChildren(...children) { this.children = children; }
    };
  }
  const context = {
    URL,
    Intl,
    Date: class extends Date {
      constructor(...args) {
        if (args.length) super(...args);
        else super(date);
      }
    },
    window: {},
    console: { error() {}, warn() {} },
    document: {
      addEventListener() {},
      createElement: element,
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, element("div"));
        return elements.get(id);
      }
    },
    async fetch(url, options) {
      requests.push(url);
      assert.equal(new URL(url).origin, "https://api.ftcscout.org");
      assert.equal(options, undefined, "Public API requests must not send credentials");
      const path = decodeURIComponent(new URL(url).pathname);
      const response = responses[path];
      assert.ok(response, `Unexpected API request: ${url}`);
      return {
        ok: (response.status || 200) === 200,
        status: response.status || 200,
        async json() { return response.data; }
      };
    }
  };
  vm.createContext(context);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, `
    globalThis.statistics = { computeTeamStats, fetchTelemetry, renderSchedule, season: FTC_CONFIG.season };
  })();`), context);
  return { ...context.statistics, requests, elements };
}

test("automatically rolls over on September 1 UTC, not January 1", () => {
  for (const [date, expected] of [
    ["2026-08-31T23:59:59.999Z", "2025"],
    ["2026-09-01T00:00:00.000Z", "2026"],
    ["2027-01-01T00:00:00.000Z", "2026"],
    ["2027-08-31T23:59:59.999Z", "2026"],
    ["2027-09-01T00:00:00.000Z", "2027"],
    ["2028-02-29T12:00:00.000Z", "2027"],
    ["2028-09-01T00:00:00.000Z", "2028"]
  ]) {
    assert.equal(loadStatistics({}, date).season, expected, date);
  }
});

function eventResponses(matches, season = 2026) {
  return {
    [`/rest/v1/teams/21592/events/${season}`]: {
      data: [{ eventCode: "ILPE1", stats: { rank: 2 } }]
    },
    [`/rest/v1/teams/12345/events/${season}`]: {
      data: [{ eventCode: "ILPE1", stats: { rank: 3 } }]
    },
    [`/rest/v1/events/${season}/ILPE1`]: {
      data: {
        code: "ILPE1",
        name: "Peoria Meet 1",
        start: `${season}-10-31`,
        end: `${season}-10-31`,
        remote: false
      }
    },
    [`/rest/v1/events/${season}/ILPE1/matches`]: { data: matches }
  };
}

function scoredMatch(overrides = {}) {
  return {
    id: 1,
    hasBeenPlayed: true,
    tournamentLevel: "Quals",
    scores: {
      red: { totalPoints: 100, autoPoints: 30 },
      blue: { totalPoints: 80, autoPoints: 20 }
    },
    teams: [
      { teamNumber: 21592, alliance: "Red" },
      { teamNumber: 12345, alliance: "Blue" }
    ],
    ...overrides
  };
}

test("loads current-season results for the homepage and comparison teams", async () => {
  const stats = loadStatistics(eventResponses([
    scoredMatch(),
    scoredMatch({ id: 2, hasBeenPlayed: false, scores: null }),
    scoredMatch({ id: 3, scores: null }),
    scoredMatch({ id: 20001, tournamentLevel: "Finals" }),
    scoredMatch({ id: 4, teams: [{ teamNumber: 99999, alliance: "Red" }] })
  ]));

  await stats.fetchTelemetry();
  assert.equal(stats.elements.get("avg-score-card").textContent, "100");
  assert.equal(stats.elements.get("win-rate-card").textContent, "100%");
  assert.equal(stats.elements.get("peoria-record").textContent, "1-0-0");
  assert.equal(stats.elements.get("peoria-rank").textContent, "#2");
  assert.equal(stats.elements.get("stats-status").textContent, "");

  const comparison = await stats.computeTeamStats(12345);
  assert.equal(comparison.avgScore, 80);
  assert.equal(comparison.avgAuto, 20);
  assert.equal(comparison.winRate, 0);
  assert.equal(comparison.totalMatches, 1);
  assert.equal(comparison.rawMatches[0].myAlliance, "blue");
  assert.equal(comparison.rawMatches[0].description, "Qualification 1");
  assert.deepEqual(Array.from(comparison.rawMatches[0].redTeams), [21592]);
  assert.deepEqual(Array.from(comparison.rawMatches[0].blueTeams), [12345]);
  assert.ok(stats.requests.some((url) => url.includes("/teams/12345/events/2026")));
});

test("explains when current-season scores have not been published", async () => {
  const stats = loadStatistics(eventResponses([]));
  await stats.fetchTelemetry();
  assert.equal(stats.elements.get("avg-score-card").textContent, "N/A");
  assert.match(stats.elements.get("stats-status").textContent, /no scored qualification/);
  const result = await stats.computeTeamStats(21592);
  assert.equal(result.eventChartSummaries.length, 0);
});

test("shows API failures instead of treating failed match requests as empty results", async () => {
  const responses = eventResponses([]);
  responses["/rest/v1/events/2026/ILPE1/matches"] = { status: 503, data: {} };
  const stats = loadStatistics(responses);
  await assert.rejects(stats.computeTeamStats(21592), /FTC Scout API returned 503/);
  await stats.fetchTelemetry();
  assert.equal(stats.elements.get("avg-score-card").textContent, "--");
  assert.match(stats.elements.get("stats-status").textContent, /Unable to load/);
  assert.match(stats.elements.get("schedule-status").textContent, /No upcoming events/);
});

test("loads next season automatically using the same REST score fields", async () => {
  const stats = loadStatistics(eventResponses([scoredMatch()], 2027), "2027-11-01T00:00:00Z");
  await stats.fetchTelemetry();
  assert.equal(stats.elements.get("avg-score-card").textContent, "100");
  assert.ok(stats.requests.every((url) => url.includes("/2027")));
});

test("renders upcoming events chronologically without requesting future matches", async () => {
  const responses = eventResponses([scoredMatch()]);
  responses["/rest/v1/teams/21592/events/2026"].data.unshift(
    { eventCode: "ILPE3", stats: null },
    { eventCode: "ILPE2", stats: null }
  );
  responses["/rest/v1/events/2026/ILPE2"] = {
    data: {
      code: "ILPE2", name: "Peoria Meet 2", start: "2026-11-14", end: "2026-11-14",
      venue: "School Gym", city: "Peoria", state: "IL"
    }
  };
  responses["/rest/v1/events/2026/ILPE3"] = {
    data: { code: "ILPE3", name: "Peoria Meet 3", start: "2026-12-05", end: "2026-12-06" }
  };
  const stats = loadStatistics(responses);
  await stats.fetchTelemetry();
  const cards = stats.elements.get("upcoming-events").children;
  assert.equal(cards.length, 2);
  assert.equal(cards[0].children[0].children[0].textContent, "Peoria Meet 2");
  assert.equal(cards[0].children[0].children[0].href, "https://ftcscout.org/events/2026/ILPE2");
  assert.equal(cards[0].children[1].textContent, "Nov 14, 2026");
  assert.equal(cards[0].children[2].textContent, "School Gym, Peoria, IL");
  assert.equal(cards[1].children[1].textContent, "Dec 5, 2026 - Dec 6, 2026");
  assert.equal(stats.elements.get("schedule-status").textContent, "");
  assert.equal(stats.elements.get("avg-score-card").textContent, "100");
  assert.ok(!stats.requests.some((url) => /ILPE[23]\/matches/.test(url)));
});

test("keeps events on the schedule through their end date and clears stale cards", () => {
  const stats = loadStatistics({}, "2026-11-01T23:59:59Z");
  const event = { code: "ILPE2", name: "<b>Meet</b>", start: "2026-10-31", end: "2026-11-01" };
  stats.renderSchedule([event]);
  assert.equal(stats.elements.get("upcoming-events").children.length, 1);
  assert.equal(stats.elements.get("upcoming-events").children[0].children[0].children[0].textContent, "<b>Meet</b>");
  stats.renderSchedule([]);
  assert.equal(stats.elements.get("upcoming-events").children.length, 0);
  assert.match(stats.elements.get("schedule-status").textContent, /No upcoming/);
});

test("uses the latest event rank and includes zero-score ties", async () => {
  const responses = eventResponses([scoredMatch()]);
  responses["/rest/v1/teams/21592/events/2026"].data.push({ eventCode: "ILPE2", stats: { rank: 1 } });
  responses["/rest/v1/events/2026/ILPE2"] = {
    data: { code: "ILPE2", name: "Peoria Meet 2", start: "2026-11-01", end: "2026-11-01" }
  };
  responses["/rest/v1/events/2026/ILPE2/matches"] = {
    data: [scoredMatch({
      scores: { red: { totalPoints: 0, autoPoints: 0 }, blue: { totalPoints: 0, autoPoints: 0 } }
    })]
  };
  const stats = await loadStatistics(responses).computeTeamStats(21592);
  assert.equal(stats.peoriaStats.rank, 1);
  assert.equal(stats.peoriaRecord, "1-0-1");
  assert.equal(stats.avgScore, 50);
  assert.equal(stats.winRate, 50);
  assert.equal(stats.eventChartSummaries.length, 2);
});

test("reports invalid API response shapes and missing scores explicitly", async () => {
  for (const [path, data, message] of [
    ["/rest/v1/teams/21592/events/2026", {}, /invalid team event list/],
    ["/rest/v1/events/2026/ILPE1", {}, /invalid event details/],
    ["/rest/v1/events/2026/ILPE1/matches", {}, /invalid matches/],
    ["/rest/v1/events/2026/ILPE1/matches", [scoredMatch({ scores: { red: {}, blue: {} } })], /invalid scores/]
  ]) {
    const responses = eventResponses([]);
    responses[path] = { data };
    const stats = loadStatistics(responses);
    await assert.rejects(stats.computeTeamStats(21592), message);
  }
});

test("shows schedule failure when the event API fails", async () => {
  const responses = eventResponses([]);
  responses["/rest/v1/teams/21592/events/2026"] = { status: 503 };
  const stats = loadStatistics(responses);
  await stats.fetchTelemetry();
  assert.match(stats.elements.get("stats-status").textContent, /Unable to load/);
  assert.match(stats.elements.get("schedule-status").textContent, /Unable to load/);
});

test("handles a season with no registered events", async () => {
  const stats = loadStatistics({ "/rest/v1/teams/21592/events/2026": { data: [] } });
  await stats.fetchTelemetry();
  assert.equal(stats.elements.get("avg-score-card").textContent, "N/A");
  assert.match(stats.elements.get("stats-status").textContent, /no scored qualification/);
  assert.match(stats.elements.get("schedule-status").textContent, /No upcoming/);
});
