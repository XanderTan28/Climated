# Climated — Codex Instructions

## Project purpose

Climated is an interactive city-climate web prototype. A user searches for a city, the browser retrieves historical climate and nearby building data, and the UI turns those inputs into monthly climate controls, activity-specific comfort estimates, and a procedural city scene.

## Repository map

- `apps/web`: the only implemented application. It contains the React/Vite UI, browser-side provider clients, climate/experience calculations, procedural visuals, shared frontend types, and colocated Vitest tests.
- `apps/api`: reserved Python API layout; every file, including `requirements.txt`, is currently empty. Nothing in `apps/web` calls it.
- `data/cache` and `data/profiles`: empty directories. No implemented code reads from or writes to them.
- `scripts/verify-city-layout.mjs`: implemented Windows/Edge visual smoke test. `scripts/build_city_profile.py` is an empty placeholder.
- `tests`: empty Python test placeholders; they are not an active test suite.
- `docs`: persistent architecture, status, decision, and session memory.
- `packages`: absent. There is no shared climate engine or contracts package.

## Architectural boundaries

- Preserve the implemented browser-only architecture unless the user explicitly requests an architectural change.
- UI and rendering belong in `apps/web/src/components` and `apps/web/src/pages`.
- Provider access and the current climate, experience, urban-form, and visual-profile calculations live in `apps/web/src/api`; do not claim these are supplied by `apps/api`.
- Shared frontend data shapes belong in `apps/web/src/types/climate.ts` until a real cross-application contract layer is introduced.
- Do not add logic to empty backend or data scaffolding merely because filenames suggest a future design.
- Keep city visuals data-driven. Do not add city-name conditionals or city-specific background assets without an explicit requirement.

## Development rules

- The configured package manager is npm; the lock file is `apps/web/package-lock.json`. Run Node commands from `apps/web` unless a command says otherwise.
- Install dependencies: `npm install`.
- Start development: `npm run dev`.
- Run unit/component tests: `npm test`.
- Type-check and build: `npm run build`.
- Optional visual smoke check: start Vite on `127.0.0.1:5180`, then run `node scripts/verify-city-layout.mjs` from the repository root. The script requires Node 22+, Microsoft Edge at its hard-coded Windows path, and optionally accepts `CLIMATED_PREVIEW_URL`.
- No root package manager configuration, Python environment, lint command, formatter command, CI workflow, Docker service, or code-generation command is currently configured.
- Preserve unrelated working-tree changes. The current frontend implementation is largely uncommitted.

## Coding conventions

- TypeScript is strict and no-emit, with ES modules and React JSX.
- Existing code uses functional React components, named exports for feature modules, relative extensionless imports, single quotes, and no semicolons.
- Keep shared interfaces and unions in `apps/web/src/types/climate.ts` rather than duplicating shapes.
- Colocate frontend tests as `*.test.ts` or `*.test.tsx` under `apps/web/src`.
- No formatter or linter enforces style; follow nearby code and avoid broad mechanical rewrites.

## Data handling rules

- Runtime city and climate data comes from remote providers; there is no bundled city database or persisted provider response.
- `data/cache` is ignored except for a possible `.gitkeep`; do not commit downloaded cache contents.
- `data/profiles` is empty and has no established format. Do not label it generated or manually editable until a pipeline defines that contract.
- Never commit secrets. No environment-variable contract or `.env.example` currently exists.
- Preserve provider attribution displayed by the web UI.

## Testing and validation

- For frontend logic or UI changes, run `npm test` and `npm run build` when the environment permits.
- The current Vitest suite covers the empty initial state, opening city search, climate normalization, urban metric summarization, and city visual classification.
- Use `scripts/verify-city-layout.mjs` for relevant responsive or procedural-scene changes, subject to its Windows/Edge requirements. It mocks provider requests in the browser and writes screenshots to a temporary directory.
- Do not present the empty root `tests/*.py` files as tests.

## Documentation rules

- Keep project-memory files in English and grounded in repository evidence.
- Ownership: `AGENTS.md` explains how Codex works; `docs/architecture.md` explains structure; `docs/current-status.md` describes the present; `docs/decisions.md` records why meaningful choices exist; `docs/session-log.md` records repository-changing sessions.
- `README.md` is the user-facing repository entry point. Keep its project description, prerequisites, setup, supported commands, external-service behavior, and current capabilities aligned with the implemented repository.
- Clearly distinguish implemented code from scaffolding and inferred intent. Do not copy transient task detail into every memory file.

## Mandatory project-memory maintenance

For every user request that results in any repository file being created, modified, renamed, moved, or deleted, project-memory maintenance is part of the task.

This requirement applies regardless of the size of the change.

Before sending the final response for any repository-changing task:

1. Inspect `git status` and `git diff`.

2. Review `docs/current-status.md`.

   Update it whenever the repository's:
   - implementation status
   - active work
   - blockers
   - important files
   - next steps

   have materially changed.

3. Append exactly one concise entry to `docs/session-log.md`.

   Record:
   - date
   - task objective
   - files changed
   - result
   - important implementation details
   - blockers, if any
   - next recommended step

4. Review `docs/decisions.md`.

   Update it only if the task introduced, removed, or changed a meaningful architectural or technical decision.

   Do not record trivial implementation details.

5. Review `docs/architecture.md`.

   Update it only if the task changed:
   - module responsibilities
   - architecture
   - dependencies
   - interfaces
   - data flow
   - external service relationships

6. Review `AGENTS.md`.

   Update it only if repository-wide:
   - rules
   - conventions
   - supported commands
   - workflows
   - constraints

   changed.

7. Review `README.md`.

   Update it when the task changed any user-facing or contributor-facing information, including:
   - project purpose or implemented capabilities
   - prerequisites, installation, development, test, or build commands
   - dependencies, configuration, or environment variables
   - external providers or runtime data behavior
   - important limitations or supported workflows

   Do not update `README.md` for internal changes that do not affect its documented information.

8. Inspect `git diff` again and verify that documentation and `README.md` reflect the actual repository state.

9. Only after completing this review may the task be considered finished and the final response be sent.

Do not modify documentation merely to create activity.

Files without meaningful changes should remain untouched.

Do not store full prompt/response transcripts in project-memory files.

## Session startup procedure

At the beginning of a new development session:

1. Read `AGENTS.md`.
2. Read `docs/current-status.md`.
3. Read `docs/architecture.md`.
4. Read the most recent relevant entries in `docs/session-log.md`.
5. Read relevant entries in `docs/decisions.md` before changing architecture or core technical behavior.
6. Inspect `git status`.
7. Inspect the code relevant to the current task.

Do not rely on previous chat history being available.
Treat repository state and project-memory files as the authoritative handoff context.
