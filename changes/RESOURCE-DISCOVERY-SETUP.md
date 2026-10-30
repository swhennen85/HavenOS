# HavenOS resource discovery test package

This is an incremental update for the existing HavenOS React/Vite + SQLite project.

## Files in this package
- `src/App.tsx` — connects the existing search form to live resource discovery and displays results.
- `src/directory.css` — styles for search results and external directory links.
- `server/index.mjs` — local API server, SQLite persistence, Nominatim geocoding cache, and Overpass discovery.
- `database/schema.sql` — current SQLite schema plus discovery candidate and geocode cache tables.
- `package.json` — changes `dev` to start the Node API and Vite together. Existing dependencies are unchanged.
- `.gitignore` — ensures SQLite database/WAL files are not committed.

## Apply to the existing HavenOS repository
Extract this ZIP into the HavenOS repository folder and allow the listed files to replace the matching files. Do not delete `src/styles.css`, `src/main.tsx`, `vite.config.ts`, or `index.html`.

The existing `src/styles.css` is retained. `App.tsx` imports the additional `src/directory.css`.

No npm package installation is required because this uses Node's built-in `node:sqlite` module and existing project dependencies.

## Start on the Windows library workstation
In PowerShell, from the HavenOS repository root:

```powershell
$nodeDir = (Resolve-Path ".\tools\node-runtime").Path
$env:Path = "$nodeDir;$env:Path"
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

If the project uses the portable Node runtime elsewhere, set `$nodeDir` to that folder instead.

The first server start applies the schema and creates `data/havenos.sqlite` if it does not exist. It does not delete or replace existing database records.

## Test
1. Open the local Vite URL printed in the terminal (normally `http://127.0.0.1:5173`).
2. Search a category and a place, e.g. `Food & groceries` + `Joliet, IL`.
3. Try another place, e.g. `Chicago, IL`, `60435`, or `Springfield, IL`.
4. Open `/api/health` to confirm the local SQLite API is running.
5. Search results show two kinds of information:
   - Existing HavenOS listings that are published in SQLite.
   - OpenStreetMap mapped places marked **Discovered · not verified**.
6. Google Maps, Google Search, 211, HUD, and OpenStreetMap links are included as fallback discovery paths.

## Important data and privacy notes
- Location searches are user-triggered. HavenOS sends the typed place name to the OpenStreetMap Nominatim geocoder.
- Geocoding results are cached locally; nearby Overpass results are cached for 15 minutes per category/location. The public Nominatim service is limited to at most one request per second, requires an identifying User-Agent, and does not permit autocomplete or bulk harvesting. See https://operations.osmfoundation.org/policies/nominatim/
- Nearby places are queried from the public Overpass API. Public Overpass instances are shared infrastructure and may be temporarily unavailable. See https://wiki.openstreetmap.org/wiki/Overpass_API
- OpenStreetMap data requires attribution. See https://www.openstreetmap.org/copyright
- A mapped place is not proof that the location provides the service being searched for, is open, accepts walk-ins, has vacancies, or has current capacity.
- This is a local development/testing adapter, not a production multi-user geocoding service. Before public launch, select a sustainable geocoder/Overpass provider or self-host, add request throttling/caching appropriate to expected traffic, and review licensing.
- The API binds to `127.0.0.1` for local development. Do not expose it directly to the public internet.
