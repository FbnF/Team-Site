https://fbnf.github.io/Team-Site/

Homepage statistics, the upcoming event schedule, and team comparisons use
FTC Scout's public REST API (`https://api.ftcscout.org/rest/v1`) directly, without
credentials or a CORS proxy. They automatically switch to the next FTC
season on September 1 at 00:00 UTC, when the page is loaded. FIRST identifies a
season by its starting year: `"2026"` is the 2026-2027 season. January through
August continue using the previous year's season. The comparison label follows
the same configuration; no annual code update is needed. Historical recap pages
keep their own fixed season.

Statistics use played qualification matches and alliance total/auto scores,
not individual-team OPR. Only events with scored matches appear in the charts;
future events appear in the schedule instead. Rankings use the latest available
event in each category. Event dates display as listed, without timezone shifts.
The schedule includes events through their listed end date, using today's UTC date.

Statistics depend on FTC Scout having published scores. The homepage shows a
message when no results are available or the API cannot be reached. Historical
recaps still use their original FIRST API integration.

Run the statistics regression tests with `node --test tests/statistics.test.js`.