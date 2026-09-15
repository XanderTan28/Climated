# Architecture

Last reviewed: 2026-09-15

## Overview

Climated currently runs as a browser-only React application. It searches remote city data, downloads historical climate observations and an OpenStreetMap building sample, derives display models in the frontend, and renders an interactive climate experience with a procedural SVG city scene. The Python API, offline profile builder, and root Python tests are empty scaffolding and do not participate in the application.

## Repository structure

```text
apps/web/                       Implemented React/Vite application
  src/api/                      Provider clients and frontend domain calculations
  src/components/               Search, controls, weather scene, and SVG visuals
  src/pages/CityExperiencePage  Page state and request orchestration
  src/types/climate.ts          Frontend data contracts
apps/api/                       Empty Python API scaffold
data/cache/                     Empty ignored cache directory
data/profiles/                  Empty profile directory with no defined format
scripts/verify-city-layout.mjs  Implemented visual smoke test
scripts/build_city_profile.py   Empty placeholder
tests/                          Empty Python test placeholders
docs/                           Project memory
```

There is no `packages/` directory, root package manifest, workspace configuration, or implemented shared package.

## Frontend

`apps/web` uses React 19, TypeScript with strict checking, Vite, and CSS. `App.tsx` mounts `CityExperiencePage`, which owns selected city, loading status, month, time, activity, random-day variant, normalized climate, and visual-profile state.

The page composes:

- `CitySearch`: debounced remote search with cancellation when the query changes or the dialog closes.
- `ControlPanel`: month, time, activity, comfort-score, and random-day interactions.
- `WeatherScene`: climate reading, weather/light state, statistics, and the generated city background.
- `ProceduralCity`: deterministic SVG geometry from a city visual profile; time changes lighting but not geometry.

`styles.css` owns the responsive, borderless layout and visual states. Google Fonts are imported directly by CSS.

## Browser-side data and domain modules

- `api/cities.ts` calls Open-Meteo geocoding and maps results to `CitySearchResult`.
- `api/climateApi.ts` calls the Open-Meteo historical archive, aggregates time series into 12 `MonthlyClimate` values, and derives initial activity scores and summaries.
- `api/urban.ts` requests building ways around the city coordinate from Overpass endpoints and summarizes tags into `UrbanMetrics`.
- `api/cityVisual.ts` classifies metrics into five urban archetypes, infers a broad climate family, and produces a deterministic `CityVisualProfile`.
- `api/climateModel.ts` combines a monthly climate, time, activity, and day variant into the displayed `ExperienceState` and comfort verdict.
- `api/http.ts` provides fetch timeout and abort forwarding.
- `api/experience.ts` defines the six activity options and four day variants.

These calculations are not a separate climate engine. They are coupled to the web application under `src/api`.

## API / backend

### Scaffolded / planned

`apps/api/app/{main,routes,weather,climate,experience,models}.py` and `apps/api/requirements.txt` exist but are zero-byte files. No framework, route, schema, dependency, startup command, or contract is implemented. The directory names suggest a possible backend boundary, but its role is not explicitly established.

## Contracts and schemas

### Implemented

Frontend-only TypeScript types are centralized in `apps/web/src/types/climate.ts`. They describe activities, weather, normalized monthly climate, experience state, city search results, urban metrics, and procedural visual profiles.

### Not implemented

There is no API schema, runtime validation, generated client, or cross-language/shared contracts package.

## Data layer

No persistence layer is implemented. Provider data is held in React memory for the selected city and is lost on refresh. `data/cache` and `data/profiles` are empty; no code uses them. `.gitignore` excludes `data/cache/*` while allowing a future `.gitkeep`, although none currently exists.

## External services

- Open-Meteo geocoding: browser-side city search with a 10-second timeout.
- Open-Meteo historical archive: browser-side climate download with a 20-second timeout per attempt. The code first requests 2021–2025 and falls back to 2023–2025.
- OpenStreetMap building data through three public Overpass endpoints: a 450-meter building-way sample, attempted sequentially with a 22-second timeout per endpoint.
- Google Fonts: `DM Sans` and `Manrope`, imported at runtime from `fonts.googleapis.com`.

No server proxy, authentication, rate-limit management, response cache, or offline fallback is implemented.

## Data flow

```text
User search
  -> CitySearch
  -> Open-Meteo geocoding
  -> CitySearchResult
  -> CityExperiencePage starts climate and urban requests concurrently

Open-Meteo archive
  -> normalizeClimate
  -> MonthlyClimate[12]
  -> getExperience + inferClimateFamily
  -> ControlPanel and WeatherScene

Overpass building tags
  -> summarizeUrbanSample
  -> classifyUrbanForm
  -> resolveCityVisualProfile
  -> ProceduralCity
```

Climate completion gates the ready UI. Once climate is available, the page renders an `unclassified` visual profile while the urban request continues. Successful urban data replaces that profile; failure leaves the scene intentionally unclassified and shows a notice. A request counter prevents stale city results from replacing the latest selection, but in-flight requests are not actively aborted by `CityExperiencePage`.

## Dependency direction

```text
main.tsx -> App.tsx -> CityExperiencePage
CityExperiencePage -> components + src/api + src/types
components -> src/api helpers + src/types
src/api provider/domain modules -> src/types
src/api provider modules -> remote HTTP services
```

`apps/api`, `data`, root `tests`, and `build_city_profile.py` have no runtime dependency edges.

## Implemented vs scaffolded architecture

### Implemented

- A city-first responsive web experience.
- Remote city and climate retrieval and normalization.
- Activity/time/day-variant experience calculations.
- Best-effort urban sampling and data-driven procedural backgrounds.
- Vitest unit/component coverage and a Windows/Edge visual smoke script.

### Scaffolded / planned

- Python API modules.
- Offline city-profile generation.
- Root Python tests.
- Local cache/profile storage.
- Docker Compose configuration.

### Inferred

The directory names imply an eventual backend and profile-building workflow, but no implementation or documentation establishes how they should work. A separate climate engine and shared contracts layer are not present.

## Open architectural questions

- Whether provider calls and domain calculations should remain browser-side or move behind `apps/api`.
- Whether normalized climate profiles should be generated, cached, or persisted, and what schema would own them.
- Whether frontend TypeScript types should become cross-application contracts.
- How the comfort and urban-archetype heuristics will be calibrated and versioned.
- What deployment target, API framework, and CI strategy should be adopted.
