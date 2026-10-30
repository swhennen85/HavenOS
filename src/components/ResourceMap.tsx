import { useMemo } from "react";
import "../styles/resource-map.css";

export type MapPoint = {
  id: string;
  name: string;
  category: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  verificationStatus?: string;
  addressLabel?: string;
  sourceLabel?: string;
};

type Props = {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

/** Offline coordinate visualization. This is not a street basemap. */
export default function ResourceMap({ points, selectedId, onSelect }: Props) {
  const located = useMemo(() => points.filter((point) =>
    Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    Math.abs(point.latitude as number) <= 90 && Math.abs(point.longitude as number) <= 180
  ), [points]);

  const bounds = useMemo(() => {
    if (!located.length) return null;
    const lats = located.map((p) => p.latitude as number);
    const lons = located.map((p) => p.longitude as number);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const latPad = Math.max((maxLat - minLat) * 0.16, 0.012);
    const lonPad = Math.max((maxLon - minLon) * 0.16, 0.015);
    return { minLat: minLat - latPad, maxLat: maxLat + latPad, minLon: minLon - lonPad, maxLon: maxLon + lonPad };
  }, [located]);

  if (!located.length) return (
    <section className="haven-map" aria-label="Resource location map">
      <div className="haven-map-heading"><div><h3>Resource map</h3><p>Geographic visualization of matching records</p></div><span className="haven-map-count">0 mapped</span></div>
      <div className="haven-map-empty"><span aria-hidden="true">⌖</span><strong>No coordinates available yet</strong><p>Search results can still appear below. Records need valid latitude and longitude to appear here.</p></div>
    </section>
  );

  return (
    <section className="haven-map" aria-label="Resource location map">
      <div className="haven-map-heading"><div><h3>Resource map</h3><p>Offline coordinate view · no external map service</p></div><span className="haven-map-count">{located.length} mapped</span></div>
      <div className="haven-map-plot">
        <svg className="haven-map-svg" viewBox="0 0 100 100" role="img" aria-label={`${located.length} resource locations plotted by geographic coordinates`} preserveAspectRatio="none">
          <defs><pattern id="haven-map-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" className="haven-map-grid-line" fill="none" /></pattern></defs>
          <rect width="100" height="100" fill="url(#haven-map-grid)" />
          <path d="M0 50 H100 M50 0 V100" className="haven-map-axis" />
          {located.map((point) => {
            const lonRange = bounds!.maxLon - bounds!.minLon || 1;
            const latRange = bounds!.maxLat - bounds!.minLat || 1;
            const x = 7 + (((point.longitude as number) - bounds!.minLon) / lonRange) * 86;
            const y = 8 + ((bounds!.maxLat - (point.latitude as number)) / latRange) * 82;
            const selected = point.id === selectedId;
            const category = point.category.toLowerCase();
            const color = category === "food" ? "food" : category === "shelter" ? "shelter" : category === "healthcare" ? "healthcare" : "other";
            return <g key={point.id} className={`haven-map-marker ${selected ? "is-selected" : ""}`} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={`${point.name}, ${point.category}`} onClick={() => onSelect?.(point.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect?.(point.id); } }}>
              <circle r={selected ? 3.5 : 2.8} className={`haven-map-marker-halo ${color}`} /><circle r={selected ? 1.65 : 1.3} className={`haven-map-marker-core ${color}`} />
            </g>;
          })}
        </svg>
        <div className="haven-map-north" aria-hidden="true">N ↑</div><div className="haven-map-disclaimer">Coordinate plot, not a street-level map</div>
      </div>
      <div className="haven-map-legend" aria-label="Map category legend"><span><i className="food" />Food</span><span><i className="shelter" />Shelter</span><span><i className="healthcare" />Healthcare</span><span><i className="other" />Other</span></div>
      <p className="haven-map-footnote">Selecting a marker can focus its matching result card. Locations without valid coordinates remain in the results list.</p>
    </section>
  );
}
