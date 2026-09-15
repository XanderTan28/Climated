# Technical Decisions

Decision statuses used here:

- **Accepted**: established by current code, configuration, or documentation.
- **Inferred**: strongly suggested by repository structure but not explicitly established.
- **Proposed**: an unresolved proposal found in the repository; none are currently recorded.
- **Superseded**: replaced by a later recorded decision; none are currently recorded.

## ADR-001 — Ship the current prototype as a browser application

Status: Accepted  
Date: 2026-09-15

### Context

Only `apps/web` contains executable application code. The Python API files and Docker Compose file are empty.

### Decision

The current prototype runs in React/Vite and performs provider access, normalization, experience calculations, and rendering in the browser.

### Rationale

This is the architecture implemented by the repository; no supported backend command or interface exists.

### Consequences

The prototype is simple to run, but provider availability, CORS, timeouts, and calculation logic are exposed to the client. Moving responsibilities to a backend would be an architectural change.

### Evidence

`apps/web/src/pages/CityExperiencePage.tsx`, `apps/web/src/api`, `apps/web/package.json`, and zero-byte files under `apps/api`.

## ADR-002 — Discover cities remotely rather than bundle a city database

Status: Accepted  
Date: 2026-09-15

### Context

The initial UI has no selected city or bundled city profile.

### Decision

Search Open-Meteo geocoding after at least two typed characters and use the selected result's coordinates and metadata for subsequent requests.

### Rationale

Remote lookup supports arbitrary cities without maintaining local city-name data.

### Consequences

Search requires network access and provider availability. Results exist only in component state and are not persisted.

### Evidence

`apps/web/src/api/cities.ts`, `apps/web/src/components/CitySearch.tsx`, and `apps/web/src/App.test.tsx`.

## ADR-003 — Normalize climate and calculate experience in the frontend

Status: Accepted  
Date: 2026-09-15

### Context

The UI needs a consistent 12-month model and activity/time-specific values from historical observations.

### Decision

Aggregate Open-Meteo archive data into `MonthlyClimate` in `climateApi.ts`, then derive the current `ExperienceState` in `climateModel.ts` from month, time, activity, and day variant.

### Rationale

The normalized model keeps rendering components independent of the provider response shape and supports immediate interaction after loading.

### Consequences

Scoring, weather thresholds, summaries, and apparent-temperature behavior are product heuristics embedded in the web app. They are not versioned, calibrated, or shared with a backend.

### Evidence

`apps/web/src/api/climateApi.ts`, `apps/web/src/api/climateModel.ts`, `apps/web/src/api/experience.ts`, and `apps/web/src/types/climate.ts`.

## ADR-004 — Generate city backgrounds from measured urban form

Status: Accepted  
Date: 2026-09-15

### Context

The interface needs visible city-type differences without maintaining a city-specific background for every searchable place.

### Decision

Summarize nearby OpenStreetMap building tags, classify an urban archetype from those metrics, and render deterministic procedural SVG geometry. City identity affects the random seed, while archetype selection does not depend on city-name checks.

### Rationale

This produces reusable city differentiation from inspectable parameters and avoids city-specific assets.

### Consequences

Visual fidelity depends on OSM coverage and heuristic thresholds. Sparse or unavailable samples produce the neutral `unclassified` archetype.

### Evidence

`apps/web/src/api/urban.ts`, `apps/web/src/api/cityVisual.ts`, `apps/web/src/components/ProceduralCity.tsx`, and `apps/web/src/api/cityVisual.test.ts`.

## ADR-005 — Let climate readiness gate the UI and treat urban form as enrichment

Status: Accepted  
Date: 2026-09-15

### Context

Overpass responses can be slower or less reliable than climate data.

### Decision

Start climate and urban requests concurrently. Render the interactive experience after climate succeeds using an unclassified city profile, then replace it if urban metrics arrive. Urban failure must not fail the climate experience.

### Rationale

Users can interact with climate data without waiting for all Overpass endpoint attempts.

### Consequences

The background can change after first render, and a failed urban request leaves a neutral scene with a status notice.

### Evidence

`selectCity` in `apps/web/src/pages/CityExperiencePage.tsx`.

## ADR-006 — Reserve a backend directory without choosing its implementation

Status: Inferred  
Date: 2026-09-15

### Context

`apps/api/app` contains filenames for routes, models, weather, climate, and experience, but all are empty and there is no dependency manifest content.

### Decision

The structure reserves space for a possible Python API. No framework, responsibility boundary, public interface, or adoption decision can be inferred beyond that reservation.

### Rationale

The directory and filenames are the only evidence of intent.

### Consequences

Future work must make and document an explicit backend decision before relying on this scaffold. Current code must not be described as using it.

### Evidence

Zero-byte files under `apps/api/app` and `apps/api/requirements.txt`.
