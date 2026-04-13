(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════════════════════
  //  AUTONOMOUS VISUALIZER — EDIT THIS BLOCK TO ADD / UPDATE ROUTINES EACH SEASON
  //
  //  HOW TO ADD A NEW ROUTINE:
  //   1. Copy any existing entry below and paste it at the end of the ROUTINES array
  //   2. Update: id (unique, no spaces), name, alliance ("red"/"blue"), desc, wps
  //   3. Save — it will automatically appear in the carousel
  //
  //  WAYPOINT FORMAT  { x, y, h, ev, label, detail, in }
  //  ──────────────────────────────────────────────────────────────────────────────
  //   x, y   → field inches from center.  X: right=+, left=−  Y: up=+, down=−
  //   h      → robot heading in degrees.  0=right  90=up  180=left  270=down
  //   ev     → null = nothing  |  "shoot" = PAUSES animation & shows explanation
  //   label  → short title shown on the pause card   (set null if ev is null)
  //   detail → full explanation text on the pause card (set null if ev is null)
  //   in     → true = intake gate is open traveling TO this point (path turns green)
  // ═══════════════════════════════════════════════════════════════════════════════

  // ─── ROUTINE DATA ─────────────────────────────────────────────────────────────
  const ROUTINES = [

    // ── SMALL TRIANGLE (right-side start) ───────────────────────────────────────
    {
      id: "smallRedSimple", name: "SmallRedSimple", alliance: "red",
      desc: "1 launch · right side · park",
      wps: [
        { x:  60,   y: -16,  h: 180,    ev: null,    label: null,        detail: null,                                                                                             in: false },
        { x:  51,   y:  10,  h: 153.5,  ev: "shoot", label: "Launch",    detail: "Shooter revved to 1047 RPM. Side gate opens and artifacts are fed through the flywheel launcher.",   in: false },
        { x:  55,   y:  35,  h: 180,    ev: null,    label: null,        detail: null,                                                                                             in: false },
      ]
    },
    {
      id: "smallBlueSimple", name: "SmallBlueSimple", alliance: "blue",
      desc: "1 launch · right side · park",
      wps: [
        { x:  60,   y: -16,  h: 180,    ev: null,    label: null,        detail: null,                                                                                             in: false },
        { x:  52,   y: -10,  h: 200.55, ev: "shoot", label: "Launch",    detail: "Shooter revved to 1047 RPM. Side gate opens and artifacts are fed through the flywheel launcher.",   in: false },
        { x:  55,   y: -35,  h: 180,    ev: null,    label: null,        detail: null,                                                                                             in: false },
      ]
    },
    {
      id: "smallRedTri", name: "SmallTriRed", alliance: "red",
      desc: "2 launches · 1 racks collected · park",
      wps: [
        { x:  60,    y: -16,  h: 180,   ev: null,    label: null,         detail: null,                                                                                                                          in: false },
        { x:  51,    y:  10,  h: 153.5, ev: "shoot", label: "Launch #1",  detail: "Shooter at 1047 RPM. Side gate opens, artifacts fed into flywheel. Robot will head out to collect a racks line next.",           in: false },
        { x:  31.8,  y:  19,  h: 85,    ev: null,    label: null,         detail: null,                                                                                                                          in: true  },
        { x:  31.8,  y:  48,  h: 85,    ev: null,    label: null,         detail: null,                                                                                                                          in: true  },
        { x:  31.8,  y:  58,  h: 85,    ev: null,    label: null,         detail: null,                                                                                                                          in: true  },
        { x:  51,    y:  10,  h: 149,   ev: "shoot", label: "Launch #2",  detail: "Returns to shoot position. Fires artifacts collected from racks line. Green path = intake gate was open collecting artifacts.",      in: false },
        { x:  55,    y:  35,  h: 180,   ev: null,    label: null,         detail: null,                                                                                                                          in: false },
      ]
    },
    {
      id: "smallBlueTri", name: "SmallTriBlue", alliance: "blue",
      desc: "2 launches · 1 racks collected · park",
      wps: [
        { x:  60,    y: -16,  h: 180,   ev: null,    label: null,         detail: null,                                                                                                                        in: false },
        { x:  52,    y: -10,  h: 204.2, ev: "shoot", label: "Launch #1",  detail: "Shooter at 1047 RPM. Side gate opens, artifacts fed into flywheel. Robot heads out to collect a racks line after this.",       in: false },
        { x:  30.3,  y: -26,  h: 270,   ev: null,    label: null,         detail: null,                                                                                                                        in: true  },
        { x:  30.3,  y: -48,  h: 270,   ev: null,    label: null,         detail: null,                                                                                                                        in: true  },
        { x:  30.3,  y: -59,  h: 270,   ev: null,    label: null,         detail: null,                                                                                                                        in: true  },
        { x:  52,    y: -14,  h: 215,   ev: "shoot", label: "Launch #2",  detail: "Returns to shoot position. Fires artifacts collected from racks line. Green path = intake gate was open collecting artifacts.",    in: false },
        { x:  55,    y: -35,  h: 180,   ev: null,    label: null,         detail: null,                                                                                                                        in: false },
      ]
    },

    // ── BIG TRIANGLE (left-side start) ──────────────────────────────────────────
    {
      id: "red3", name: "BigTriRED3", alliance: "red",
      desc: "1 launch · left side start",
      wps: [
        { x: -57,  y:  36,   h: 90,  ev: null,    label: null,       detail: null,                                                                                           in: false },
        { x: -29,  y:  11.5, h: 120, ev: "shoot", label: "Launch",   detail: "Shooter revved to 780 RPM. Side gate opens and artifacts are fed through the flywheel launcher.", in: false },
      ]
    },
    {
      id: "blue3", name: "BigTriBLUE3", alliance: "blue",
      desc: "1 launch · left side start",
      wps: [
        { x: -57,  y: -36,   h: 270, ev: null,    label: null,       detail: null,                                                                                           in: false },
        { x: -29,  y: -11.5, h: 247, ev: "shoot", label: "Launch",   detail: "Shooter revved to 790 RPM. Side gate opens and artifacts are fed through the flywheel launcher.", in: false },
      ]
    },
    {
      id: "red6", name: "BigTriRED6", alliance: "red",
      desc: "2 launches · 1 racks collected",
      wps: [
        { x: -57,  y:  36,   h: 90,  ev: null,    label: null,         detail: null,                                                                                                       in: false },
        { x: -20,  y:  20,   h: 132, ev: "shoot", label: "Launch #1",  detail: "Shooter at 780 RPM. Side gate opens, artifacts fed into flywheel. Robot heads out to collect racks line 1.",   in: false },
        { x: -3,   y:  24,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -3,   y:  48,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -3,   y:  45,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -29,  y:  11.5, h: 130, ev: "shoot", label: "Launch #2",  detail: "Returns to shooting zone and fires artifacts collected from racks line 1.",                                    in: false },
      ]
    },
    {
      id: "red6clear", name: "BigTriRED6Clear", alliance: "red",
      desc: "2 launches · 1 racks + clear maneuver",
      wps: [
        { x: -57,  y:  36,   h: 90,  ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x: -20,  y:  20,   h: 132, ev: "shoot", label: "Launch #1",  detail: "Shooter at 780 RPM. Fires initial load before collecting.",                                            in: false },
        { x: -3,   y:  24,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x: -3,   y:  48,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x: -3,   y:  45,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x:  1,   y:  40,   h: 180, ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x:  1,   y:  54,   h: 180, ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x: -29,  y:  11.5, h: 118, ev: "shoot", label: "Launch #2",  detail: "Clears field elements from the path, then returns to fire collected artifacts.",                           in: false },
      ]
    },
    {
      id: "blue6", name: "BigTriBLUE6", alliance: "blue",
      desc: "2 launches · 1 racks collected",
      wps: [
        { x: -57,   y: -36,   h: 270, ev: null,    label: null,         detail: null,                                                                                                       in: false },
        { x: -20,   y: -20,   h: 230, ev: "shoot", label: "Launch #1",  detail: "Shooter at 790 RPM. Side gate opens, artifacts fed into flywheel. Robot heads out to collect racks line 1.",   in: false },
        { x: -9,    y: -24,   h: 270, ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -9,    y: -48,   h: 270, ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -9,    y: -45,   h: 270, ev: null,    label: null,         detail: null,                                                                                                       in: true  },
        { x: -30.5, y: -11.5, h: 235, ev: "shoot", label: "Launch #2",  detail: "Returns to shooting zone and fires artifacts collected from racks line 1.",                                    in: false },
      ]
    },
    {
      id: "blue6clear", name: "BigTriBLUE6Clear", alliance: "blue",
      desc: "2 launches · 1 racks + clear maneuver",
      wps: [
        { x: -57,  y: -36,   h: 270, ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x: -20,  y: -20,   h: 225, ev: "shoot", label: "Launch #1",  detail: "Shooter at 790 RPM. Fires initial load before collecting.",                                            in: false },
        { x: -8,   y: -24,   h: 270, ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x: -8,   y: -48,   h: 270, ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x: -8,   y: -45,   h: 270, ev: null,    label: null,         detail: null,                                                                                                    in: true  },
        { x:  2,   y: -40,   h: 0,   ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x:  2,   y: -52,   h: 0,   ev: null,    label: null,         detail: null,                                                                                                    in: false },
        { x: -29,  y: -11.5, h: 230, ev: "shoot", label: "Launch #2",  detail: "Clears field elements from the path, then returns to fire collected artifacts.",                           in: false },
      ]
    },
    {
      id: "red9", name: "BigTriRED9", alliance: "red",
      desc: "3 launches · 2 rackss collected",
      wps: [
        { x: -57,   y:  36,   h: 90,  ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y:  20,   h: 132, ev: "shoot", label: "Launch #1",  detail: "Shooter at 780 RPM. Fires initial load. Heads out to collect racks line 1.",                               in: false },
        { x: -1.7,  y:  24,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -1.7,  y:  48,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -1.7,  y:  45,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -12,   y:  20,   h: 150, ev: "shoot", label: "Launch #2",  detail: "Fires artifacts from racks line 1. Now collecting racks line 2.",                                              in: false },
        { x:  18.5, y:  24,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  18.5, y:  52,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  18.5, y:  45,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -29,   y:  11.5, h: 130, ev: "shoot", label: "Launch #3",  detail: "Final launch — fires all artifacts collected from racks line 2.",                                              in: false },
      ]
    },
    {
      id: "red9clear", name: "BigTriRED9Clear", alliance: "red",
      desc: "3 launches · 2 rackss + clear maneuver",
      wps: [
        { x: -57,   y:  36,    h: 90,  ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y:  20,    h: 132, ev: "shoot", label: "Launch #1",  detail: "Shooter at 780 RPM. Fires initial load. Heads to collect racks line 1.",                                  in: false },
        { x: -3,    y:  24,    h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -3,    y:  48,    h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -3,    y:  45,    h: 97,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  1,    y:  40,    h: 180, ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x:  1,    y:  55.5,  h: 180, ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y:  20,    h: 134, ev: "shoot", label: "Launch #2",  detail: "Clears field elements, then fires artifacts from racks line 1. Heading to collect racks line 2.",             in: false },
        { x:  17.5, y:  24,    h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  17.5, y:  52,    h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  17.5, y:  45,    h: 95,  ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -29,   y:  11.5,  h: 127, ev: "shoot", label: "Launch #3",  detail: "Final launch — fires artifacts from racks line 2.",                                                           in: false },
      ]
    },
    {
      id: "blue9", name: "BigTriBLUE9", alliance: "blue",
      desc: "3 launches · 2 rackss collected",
      wps: [
        { x: -57,   y: -36,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y: -20,   h: 230,   ev: "shoot", label: "Launch #1",  detail: "Shooter at 790 RPM. Fires initial load. Heads out to collect racks line 1.",                               in: false },
        { x: -8,    y: -24,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -8,    y: -48,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -8,    y: -45,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -12,   y: -20,   h: 220,   ev: "shoot", label: "Launch #2",  detail: "Fires artifacts from racks line 1. Now collecting racks line 2.",                                              in: false },
        { x:  16,   y: -24,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  16,   y: -52,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  16,   y: -45,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -30.5, y: -11.5, h: 235,   ev: "shoot", label: "Launch #3",  detail: "Final launch — fires all artifacts from racks line 2.",                                                        in: false },
      ]
    },
    {
      id: "blue9clear", name: "BigTriBLUE9Clear", alliance: "blue",
      desc: "3 launches · 2 rackss + clear maneuver",
      wps: [
        { x: -57,   y: -36,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y: -20,   h: 227,   ev: "shoot", label: "Launch #1",  detail: "Shooter at 790 RPM. Fires initial load. Heads to collect racks line 1.",                                  in: false },
        { x: -8.5,  y: -24,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -8.5,  y: -48,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -8.5,  y: -45,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  2,    y: -40,   h: 0,     ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x:  2,    y: -52,   h: 0,     ev: null,    label: null,         detail: null,                                                                                                          in: false },
        { x: -20,   y: -20,   h: 221,   ev: "shoot", label: "Launch #2",  detail: "Clears field elements, then fires artifacts from racks line 1. Heading to collect racks line 2.",             in: false },
        { x:  16,   y: -24,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  16,   y: -52,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x:  16,   y: -45,   h: 270,   ev: null,    label: null,         detail: null,                                                                                                          in: true  },
        { x: -29,   y: -11.5, h: 233.5, ev: "shoot", label: "Launch #3",  detail: "Final launch — fires artifacts from racks line 2.",                                                           in: false },
      ]
    },
    {
      id: "red12", name: "BigTriRED12", alliance: "red",
      desc: "4 launches · 3 rackss collected",
      wps: [
        { x: -57,   y:  36,   h: 90,  ev: null,    label: null,         detail: null,                                                                                                              in: false },
        { x: -20,   y:  20,   h: 132, ev: "shoot", label: "Launch #1",  detail: "Shooter at 780 RPM. Fires initial load. This run collects 3 separate racks lines.",                            in: false },
        { x: -3,    y:  24,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -3,    y:  48,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -3,    y:  45,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -20,   y:  20,   h: 140, ev: "shoot", label: "Launch #2",  detail: "Fires artifacts from racks line 1. Heading to racks line 2.",                                                      in: false },
        { x:  17.5, y:  24,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  17.5, y:  52,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  17.5, y:  45,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -20,   y:  20,   h: 145, ev: "shoot", label: "Launch #3",  detail: "Fires artifacts from racks line 2. One more collection to go.",                                                    in: false },
        { x:  12,   y:  45,   h: 150, ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  12,   y:  63,   h: 150, ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -29,   y:  11.5, h: 127, ev: "shoot", label: "Launch #4",  detail: "Final launch — fires all artifacts from racks line 3. End of autonomous.",                                        in: false },
      ]
    },
    {
      id: "red12_3racks", name: "BigTriRED12: 3 racks", alliance: "red",
      desc: "4 launches · 3 distinct racks positions",
      wps: [
        { x: -57,   y:  36,   h: 90,  ev: null,    label: null,         detail: null,                                                                                                              in: false },
        { x: -20,   y:  20,   h: 132, ev: "shoot", label: "Launch #1",  detail: "Fires initial load. 3 separate racks positions will be collected across this routine.",                        in: false },
        { x: -1.7,  y:  24,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -1.7,  y:  48,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -1.7,  y:  45,   h: 97,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -12,   y:  20,   h: 150, ev: "shoot", label: "Launch #2",  detail: "Fires artifacts from racks position 1. Next pickup is slightly further right on the field.",                       in: false },
        { x:  18.5, y:  24,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  18.5, y:  52,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  18.5, y:  45,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -12,   y:  20,   h: 150, ev: "shoot", label: "Launch #3",  detail: "Fires artifacts from racks position 2. Third racks position is far right of the field.",                          in: false },
        { x:  37.5, y:  24,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  37.5, y:  52,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x:  37.5, y:  45,   h: 95,  ev: null,    label: null,         detail: null,                                                                                                              in: true  },
        { x: -29,   y:  11.5, h: 130, ev: "shoot", label: "Launch #4",  detail: "Final launch — fires all artifacts collected from all 3 racks positions.",                                         in: false },
      ]
    },

  ]; // ← end of ROUTINES — add new seasons here

  // ─── CANVAS & FIELD CONSTANTS ─────────────────────────────────────────────────
  const C_SIZE = 500;
  const SC     = C_SIZE / 144;   // px per field-inch — no padding, image fills canvas edge-to-edge

  /** Convert field inches → canvas pixels. Field Y is up; canvas Y is down. */
  function fc(fx, fy) {
    return [(fx + 72) * SC, (72 - fy) * SC];
  }

  // ─── FIELD IMAGE ──────────────────────────────────────────────────────────────
  let fieldImage = null;

  function loadFieldImage() {
    return new Promise(resolve => {
      const img   = new Image();
      img.onload  = () => { fieldImage = img; resolve(); };
      img.onerror = () => { fieldImage = null; resolve(); };
      // Resolve relative to this script's location so it works from any page depth
      const scripts    = document.getElementsByTagName('script');
      const thisScript = document.currentScript ||
        Array.from(scripts).find(s => (s.src || '').includes('auto-visualizer'));
      img.src = thisScript
        ? new URL('Images/DecodeField.webp', new URL('.', new URL(thisScript.src))).href
        : 'Images/DecodeField.webp';
    });
  }

  // ─── PATH MATH ────────────────────────────────────────────────────────────────
  function buildSegments(wps) {
    const dists = [];
    let total = 0;
    for (let i = 1; i < wps.length; i++) {
      const d = Math.hypot(wps[i].x - wps[i - 1].x, wps[i].y - wps[i - 1].y) || 0.001;
      dists.push(d);
      total += d;
    }
    let cum = 0;
    return dists.map((d, i) => {
      const seg = { t0: cum / total, t1: (cum + d) / total, i };
      cum += d;
      return seg;
    });
  }

  function lerpAngle(a, b, t) {
    let d = b - a;
    while (d >  180) d -= 360;
    while (d < -180) d += 360;
    return a + d * t;
  }

  function posAtT(wps, segs, t) {
    t = Math.max(0, Math.min(1, t));
    let seg = segs[segs.length - 1];
    for (const s of segs) { if (t <= s.t1) { seg = s; break; } }
    const st = seg.t1 > seg.t0 ? (t - seg.t0) / (seg.t1 - seg.t0) : 1;
    const w0 = wps[seg.i], w1 = wps[seg.i + 1];
    return {
      x: w0.x + (w1.x - w0.x) * st,
      y: w0.y + (w1.y - w0.y) * st,
      h: lerpAngle(w0.h, w1.h, st),
      segI: seg.i,
    };
  }

  function totalDist(wps) {
    let d = 0;
    for (let i = 1; i < wps.length; i++)
      d += Math.hypot(wps[i].x - wps[i-1].x, wps[i].y - wps[i-1].y);
    return d;
  }

  // ─── DRAWING ──────────────────────────────────────────────────────────────────
  function drawField(ctx) {
    if (fieldImage && fieldImage.complete && fieldImage.naturalWidth > 0) {
      ctx.drawImage(fieldImage, 0, 0, C_SIZE, C_SIZE);
    } else {
      // Fallback grid if image hasn't loaded
      ctx.fillStyle = '#13151a';
      ctx.fillRect(0, 0, C_SIZE, C_SIZE);
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 0.8;
      for (let f = -72; f <= 72; f += 24) {
        const [cx]     = fc(f, 0);
        const [, cy]   = fc(0, f);
        ctx.beginPath(); ctx.moveTo(cx, 0);       ctx.lineTo(cx, C_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,  cy);      ctx.lineTo(C_SIZE, cy); ctx.stroke();
      }
    }
  }

  /** Draw a small target circle on each launch waypoint already reached. */
  function drawShootMarkers(ctx, routine, t, segs) {
    const wps = routine.wps;
    for (let i = 1; i < wps.length; i++) {
      if (wps[i].ev !== 'shoot') continue;
      if (segs[i - 1].t1 > t + 0.005) continue; // not reached yet
      const [cx, cy] = fc(wps[i].x, wps[i].y);
      const r = SC * 9;
      ctx.save();
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle   = '#fb923c';
      ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawPath(ctx, routine, t, segs) {
    const wps   = routine.wps;
    const color = routine.alliance === "red" ? "#f05050" : "#4d90f0";

    // Ghost path (faded dashes showing full route)
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    wps.forEach((wp, i) => {
      const [cx, cy] = fc(wp.x, wp.y);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Traveled path — segment by segment with intake coloring
    for (let i = 0; i < wps.length - 1; i++) {
      const seg   = segs[i];
      if (seg.t0 >= t) break;

      const endT  = Math.min(t, seg.t1);
      const endSt = seg.t1 > seg.t0 ? (endT - seg.t0) / (seg.t1 - seg.t0) : 1;
      const w0    = wps[i], w1 = wps[i + 1];
      const ex    = w0.x + (w1.x - w0.x) * endSt;
      const ey    = w0.y + (w1.y - w0.y) * endSt;

      const segColor = w1.in ? "#34d399" : color;
      const [x0c, y0c] = fc(w0.x, w0.y);
      const [x1c, y1c] = fc(ex, ey);

      ctx.save();
      ctx.strokeStyle = segColor;
      ctx.lineWidth = w1.in ? 2.5 : 2.2;
      ctx.lineJoin = "round";
      ctx.shadowColor = segColor;
      ctx.shadowBlur = w1.in ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(x0c, y0c);
      ctx.lineTo(x1c, y1c);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShootEvents(ctx, routine, t, segs) { /* replaced — see drawShootMarkers */ }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  function drawRobot(ctx, routine, pos) {
    const [cx, cy] = fc(pos.x, pos.y);
    const color    = routine.alliance === "red" ? "#f05050" : "#4d90f0";
    const robotPx  = SC * 13;
    const half     = robotPx / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-pos.h * Math.PI / 180);
    ctx.shadowColor = color;
    ctx.shadowBlur  = 12;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle   = color;
    roundRectPath(ctx, -half, -half, robotPx, robotPx, 4);
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = "#ffffff";
    ctx.globalAlpha = 0.95;
    const tip = half + 4;
    ctx.beginPath();
    ctx.moveTo(tip, 0); ctx.lineTo(tip - 9, -5); ctx.lineTo(tip - 9, 5);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ─── ANIMATION STATE ──────────────────────────────────────────────────────────
  let idx             = 0;
  let animId          = null;
  let resumeT         = 0;
  let playStartMs     = null;
  let animDurMs       = 5000;
  let playing         = false;
  let cachedSegs      = null;
  let shootFlashes    = [];        // [{cx, cy, startMs}] – expanding artifacts on canvas
  let triggeredShoots = new Set(); // waypoint indices already flashed this run
  let autoAdvanceId   = null;      // setTimeout id for carousel auto-advance

  function currentT() {
    if (playStartMs === null) return resumeT;
    return Math.min(resumeT + (performance.now() - playStartMs) / animDurMs, 1);
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  function render(t) {
    const canvas = document.getElementById('auto-canvas');
    if (!canvas) return;
    const ctx     = canvas.getContext('2d');
    const routine = ROUTINES[idx];
    const segs    = cachedSegs || buildSegments(routine.wps);
    const now     = performance.now();
    drawField(ctx);
    drawPath(ctx, routine, t, segs);
    drawShootMarkers(ctx, routine, t, segs);

    // Expanding-ring shoot flashes
    for (const flash of shootFlashes) {
      const age   = (now - flash.startMs) / 800;
      if (age >= 1) continue;
      const eased = 1 - Math.pow(1 - age, 2);  // ease-out
      ctx.save();
      ctx.strokeStyle = '#fb923c';
      ctx.globalAlpha = (1 - age) * 0.75;
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.arc(flash.cx, flash.cy, SC * 8 + eased * SC * 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - age) * 0.45;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(flash.cx, flash.cy, SC * 8 + eased * SC * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const last = routine.wps[routine.wps.length - 1];
    const pos  = t >= 1 ? { x: last.x, y: last.y, h: last.h } : posAtT(routine.wps, segs, t);
    drawRobot(ctx, routine, pos);
  }

  // ─── ANIMATION LOOP ───────────────────────────────────────────────────────────
  function animLoop() {
    const t   = currentT();
    const now = performance.now();
    const r   = ROUTINES[idx];

    // Trigger shoot flash the first time animation crosses each shoot waypoint
    r.wps.forEach((wp, i) => {
      if (i === 0 || wp.ev !== 'shoot' || triggeredShoots.has(i)) return;
      if (cachedSegs[i - 1].t1 <= t + 0.005) {
        triggeredShoots.add(i);
        const [cx, cy] = fc(wp.x, wp.y);
        shootFlashes.push({ cx, cy, startMs: now });
      }
    });

    // Prune stale flashes
    shootFlashes = shootFlashes.filter(f => (now - f.startMs) < 850);

    render(t);

    if (t < 1) {
      animId = requestAnimationFrame(animLoop);
    } else {
      playing     = false;
      resumeT     = 1;
      playStartMs = null;
      animId      = null;
      // Auto-advance to next routine after a short pause
      autoAdvanceId = setTimeout(advanceAuto, 2500);
    }
  }

  function advanceAuto() {
    autoAdvanceId = null;
    idx = (idx + 1) % ROUTINES.length;
    switchRoutine();
  }

  function stopAnim() {
    if (animId)        { cancelAnimationFrame(animId); animId = null; }
    if (autoAdvanceId) { clearTimeout(autoAdvanceId);  autoAdvanceId = null; }
    if (playStartMs !== null) {
      resumeT     = Math.min(resumeT + (performance.now() - playStartMs) / animDurMs, 1);
      playStartMs = null;
    }
    playing = false;
  }

  function startAnim() {
    if (playing) return;
    if (resumeT >= 1) resumeT = 0;
    playing     = true;
    playStartMs = performance.now();
    animId      = requestAnimationFrame(animLoop);
  }

  // ─── UI HELPERS ───────────────────────────────────────────────────────────────
  function updateInfo() {
    const r         = ROUTINES[idx];
    const nameEl    = document.getElementById('auto-name');
    const counterEl = document.getElementById('auto-counter');
    const tagEl     = document.getElementById('auto-alliance-tag');
    if (nameEl)    nameEl.textContent    = r.name;
    if (counterEl) counterEl.textContent = `${idx + 1} / ${ROUTINES.length}`;
    if (tagEl) {
      tagEl.textContent = r.alliance === 'red' ? 'Red' : 'Blue';
      tagEl.className   = 'auto-alliance-tag auto-alliance-tag--' + r.alliance;
    }
  }

  function switchRoutine() {
    stopAnim();
    const r    = ROUTINES[idx];
    cachedSegs = buildSegments(r.wps);
    const dist = totalDist(r.wps);
    animDurMs  = Math.min(Math.max(dist * 28, 2500), 11000);
    resumeT         = 0;
    triggeredShoots = new Set();
    shootFlashes    = [];
    updateInfo();
    render(0);
    startAnim();
  }

  // ─── EVENT BINDING ────────────────────────────────────────────────────────────
  function bindControls() {
    document.getElementById('auto-prev')?.addEventListener('click', () => {
      idx = (idx - 1 + ROUTINES.length) % ROUTINES.length;
      switchRoutine();
    });

    document.getElementById('auto-next')?.addEventListener('click', () => {
      idx = (idx + 1) % ROUTINES.length;
      switchRoutine();
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────────
  async function init() {
    const canvas = document.getElementById('auto-canvas');
    if (!canvas) return;
    canvas.width  = C_SIZE;
    canvas.height = C_SIZE;
    await loadFieldImage();
    switchRoutine();
    bindControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

