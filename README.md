# Climated

Interactive city-climate experience prototype. The current version uses an embedded, processed sample profile for Amsterdam and makes no weather API requests.

## Run the prototype

```bash
cd apps/web
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verify

```bash
cd apps/web
npm test
npm run build
```

The Amsterdam sample data is intentionally separated from the UI in `apps/web/src/api/amsterdam.ts`, so it can later be replaced with generated city profiles without redesigning the visual components.
