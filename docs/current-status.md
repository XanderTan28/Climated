# Current Status

Last updated: 2026-09-15

## Current project state

Climated is in early implementation. The repository contains a working, interactive frontend prototype for arbitrary city search and visualization, while the proposed backend, data pipeline, and Python tests remain empty scaffolding. The active frontend implementation is largely uncommitted; the only repository commit contains the original zero-byte directory skeleton.

The root README no longer matches the application: it describes an embedded Amsterdam-only profile with no weather requests, but the current web code searches arbitrary cities and calls remote providers at runtime.

## Implemented

- React/Vite single-page application with responsive desktop and mobile layouts.
- Remote city search through Open-Meteo geocoding; no local city database.
- Historical climate retrieval with a five-year request and three-year fallback.
- Twelve-month climate normalization, activity comfort scores, time-of-day experience modeling, and randomized day variants.
- Six exposure/activity choices: walking, cycling, exercise, stationary outdoor, waiting/commuting, and driving.
- Parallel climate and urban-form loading with an unclassified visual fallback when Overpass is slow or unavailable.
- Data-driven flat procedural SVG city backgrounds for high-rise, dense low-rise, mid-rise, suburban, and unclassified forms, with simplified buildings, roofs, windows, ground, paths, vegetation, people, sky, and clouds.
- Four Vitest files with seven passing tests when run on 2026-09-15 using `npm exec vitest -- run --configLoader runner`.
- A Windows/Edge visual smoke script covering responsive dimensions, urban archetypes, night mode, overflow, source-footer placement, and slider dimensions.

## Partially implemented

- Climate and comfort values are deterministic frontend heuristics, not a separately versioned or validated climate engine.
- Urban classification uses a 450-meter Overpass building sample and available OSM tags; missing or sparse data deliberately produces an unclassified background.
- Error and timeout states exist, but all providers are called directly from the browser with no server proxy, cache, or offline profile.
- Frontend contracts are centralized in TypeScript, but there is no runtime validation or shared API schema.

## Scaffolded but not implemented

- All files under `apps/api`, including its dependency manifest.
- `scripts/build_city_profile.py`.
- `tests/test_api.py` and `tests/test_climate.py`.
- `data/cache` and `data/profiles` processing or storage behavior.
- `docker-compose.yml`.
- Any `packages/climate-engine` or `packages/contracts` layer; the entire `packages` directory is absent.
- Linting, formatting, CI, deployment, and environment configuration.

## Current focus

The current working tree indicates active development of the city-first frontend experience, especially flat procedural city differentiation, provider resilience, responsive single-screen layout, and interactive month/time controls.

## Known issues / blockers

- Most implemented frontend files are untracked or modified relative to the sole skeleton commit, so they will not transfer to another PC until reviewed, committed, and synchronized.
- `README.md` and `apps/web/index.html` retain Amsterdam-only claims or metadata that conflict with arbitrary city search.
- Public provider availability, browser CORS behavior, rate limits, and sequential Overpass endpoint timeouts can affect loading; there is no cache or proxy.
- The visual smoke script is platform-specific and is not exposed as an npm script.
- The configured `npm test` command could not start inside the current restricted Codex environment because Vite attempted to write `node_modules/.vite-temp`; the runner-loader invocation passed all seven tests. This is not a test assertion failure.
- `MetricCard.tsx` is present but has no imports or current UI usage.

## Important files and directories

- `AGENTS.md`
- `apps/web/src/pages/CityExperiencePage.tsx`
- `apps/web/src/api/{cities,climateApi,climateModel,urban,cityVisual,experience,http}.ts`
- `apps/web/src/types/climate.ts`
- `apps/web/src/components/{CitySearch,ControlPanel,WeatherScene,ProceduralCity}.tsx`
- `apps/web/src/styles.css`
- `apps/web/package.json` and `apps/web/vite.config.ts`
- `scripts/verify-city-layout.mjs`
- `docs/architecture.md` and `docs/decisions.md`

## Next steps

1. Review the current working tree, correct stale README/HTML metadata, and create a synchronized baseline commit so project memory and implementation can move across PCs.
2. Decide whether direct browser provider access is the intended architecture or whether `apps/api` should become a real proxy/orchestration layer.
3. If a backend is adopted, define request/response contracts and move only the agreed provider/domain responsibilities; do not treat the empty scaffold as implemented.
4. Add tested caching or graceful fallback behavior for provider outages and slow Overpass responses.
5. Add repository-level CI and portable validation after the architecture boundary is settled.
