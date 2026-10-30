# Integration guide

## 1. Copy the new files
Copy `src/components/ResourceMap.tsx` and `src/styles/resource-map.css` into the same paths in your HavenOS project.

## 2. Update imports in `src/App.tsx`
Add:
```tsx
import ResourceMap, { type MapPoint } from "./components/ResourceMap";
import "./styles/resource-map.css";
```

## 3. Extend `ApiResource`
The current server's `mapResource()` already returns `coordinates`, but the frontend type omits it. Add inside `ApiResource`:
```ts
coordinates?: { latitude: number; longitude: number } | null;
```

Inside `App()`, add:
```tsx
const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
```

## 4. Fix independent source handling
Find the current `try` block in `handleSearch` that starts with `Promise.all([fetch('/api/discover...'), fetch('/api/resources...')])`. Replace that entire `try/catch/finally` with the following. Keep the existing `finally` scroll behavior as shown:

```tsx
try {
  const [discoveryResult, localResult] = await Promise.allSettled([
    fetch(`/api/discover?${params.toString()}`).then(async (response) => {
      const data = await response.json() as SearchPayload;
      if (!response.ok) throw new Error(data.error || "Geographic discovery is unavailable.");
      return data;
    }),
    fetch(`/api/resources?${resourceParams.toString()}`).then(async (response) => {
      const data = await response.json() as { items?: ApiResource[]; error?: string };
      if (!response.ok) throw new Error(data.error || "The HavenOS directory could not be searched.");
      return data;
    }),
  ]);

  const discovered = discoveryResult.status === "fulfilled" ? discoveryResult.value : null;
  const local = localResult.status === "fulfilled" ? localResult.value : null;
  setCandidates(discovered?.items || []);
  setResources(local?.items || []);

  const failures: string[] = [];
  if (discoveryResult.status === "rejected") failures.push("Live geographic discovery is temporarily unavailable.");
  if (localResult.status === "rejected") failures.push("The HavenOS directory could not be reached.");

  const resultCount = (discovered?.items?.length || 0) + (local?.items?.length || 0);
  if (failures.length) setSearchMessage(`${resultCount} results loaded. ${failures.join(" ")}`);
  else if (resultCount) setSearchMessage(`${resultCount} results found for ${selected?.name || "resources"}.`);
  else setSearchMessage("No matching records were found in the currently available local sources.");

  if (!resultCount && failures.length === 2) setSearchError("Neither search source responded. Please try again.");
} catch (error) {
  setSearchError(error instanceof Error ? error.message : "The search could not be completed.");
} finally {
  setLoading(false);
  document.getElementById("directory-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
```

## 5. Build combined map points
Immediately after `const links = externalLinks(searchedLocation || place, need);`, add:

```tsx
const mapPoints: MapPoint[] = [
  ...resources.filter((resource) => resource.coordinates).map((resource) => ({
    id: `resource:${resource.id}`,
    name: resource.name,
    category: resource.category,
    latitude: resource.coordinates?.latitude,
    longitude: resource.coordinates?.longitude,
    verificationStatus: resource.verificationStatus,
    addressLabel: [resource.address.street, resource.address.city, resource.address.state, resource.address.postalCode].filter(Boolean).join(", "),
    sourceLabel: resource.source?.name || "HavenOS directory",
  })),
  ...candidates.map((candidate) => ({
    id: `candidate:${candidate.id}`,
    name: candidate.name,
    category: candidate.category,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    verificationStatus: candidate.verificationStatus,
    addressLabel: [candidate.address.street, candidate.address.city, candidate.address.state, candidate.address.postalCode].filter(Boolean).join(", "),
    sourceLabel: "OpenStreetMap discovery",
  })),
];
```

## 6. Render the map
Inside the `showResults` section, insert immediately after the results heading and before the loading/results groups:

```tsx
{!loading && <ResourceMap points={mapPoints} selectedId={selectedMapId} onSelect={setSelectedMapId} />}
```

## 7. Highlight the corresponding cards
For local resource cards, change the opening article tag to:
```tsx
<article className={`directory-card ${selectedMapId === `resource:${resource.id}` ? "is-map-selected" : ""}`} key={resource.id}>
```
For candidate cards, change it to:
```tsx
<article className={`directory-card ${selectedMapId === `candidate:${candidate.id}` ? "is-map-selected" : ""}`} key={candidate.id}>
```
Append to the bottom of `src/directory.css`:
```css
.directory-card.is-map-selected {
  border-color: #66876b;
  box-shadow: 0 0 0 2px rgba(102, 135, 107, .16), 0 8px 24px rgba(28, 57, 42, .08);
}
```

## 8. Verify
Run:
```powershell
npm.cmd run typecheck
npm.cmd run build
```
Expected: local directory results still appear when `/api/discover` fails; valid coordinates appear as markers; records without coordinates remain in the list but are not plotted. Selecting a marker sets the selected ID, and the corresponding card receives a highlight class.

## Not included in this first patch
- Street basemap, roads, or labels.
- PMTiles / MapLibre.
- Overture or regional OSM bulk imports.
- Replacement for Nominatim or Overpass.
- Distance calculations or spatial indexes.

Those should be a separately tested next phase. The current server still depends on Nominatim and Overpass for live discovery.
