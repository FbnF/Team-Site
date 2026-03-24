(function () {
  const FTC_CONFIG = {
    user: "Kimng",
    key: "9B427DDE-72D8-46FA-95DB-4AF53CF939E6",
    team: "21592",
    season: "2025"
  };

  const AUTH_B64 = btoa(`${FTC_CONFIG.user}:${FTC_CONFIG.key}`);
  
  // Try this specific proxy - it's often more stable for GitHub Pages
  const PROXY = "https://cors-anywhere.herokuapp.com/"; 
  const BASE_URL = "https://ftc-api.firstinspires.org/v2.0";

  // ... (keep your getScriptUrl and resolveFromRoot functions) ...

  async function fetchTelemetry() {
    const root = document.getElementById('season-root');
    if (!root) return;

    console.log("Telemetry: Starting sync...");

    try {
      const headers = { 
        'Authorization': `Basic ${AUTH_B64}`,
        'X-Requested-With': 'XMLHttpRequest' // Many proxies require this header
      };
      
      // Step 1: Get Events
      const evUrl = `${BASE_URL}/${FTC_CONFIG.season}/events?teamNumber=${FTC_CONFIG.team}`;
      
      // We wrap the fetch in a trial: try proxy, if fails, try direct
      let response;
      try {
        response = await fetch(PROXY + evUrl, { headers });
      } catch (e) {
        console.warn("Proxy failed, attempting direct connection...");
        response = await fetch(evUrl, { headers });
      }

      const evData = await response.json();
      console.log("Telemetry: Events received", evData);

      // ... (rest of your match/award fetching logic) ...
