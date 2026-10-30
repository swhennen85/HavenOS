
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  readFileSync,
  existsSync,
  statSync,
  createReadStream,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const dataDir = path.join(root, "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(
  path.join(dataDir, "havenos.sqlite"),
);

db.exec(
  readFileSync(
    path.join(root, "database", "schema.sql"),
    "utf8",
  ),
);

db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

const production = process.argv.includes("--production");
const port = Number(process.env.PORT || 5173);

const NOMINATIM_URL =
  process.env.HAVENOS_GEOCODER_URL ||
  "https://nominatim.openstreetmap.org/search";

// Try multiple public Overpass instances if one is unavailable.
// A custom endpoint can be supplied through HAVENOS_OVERPASS_URL.
const OVERPASS_URLS = [
  process.env.HAVENOS_OVERPASS_URL,
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
].filter(
  (url, index, list) =>
    url && list.indexOf(url) === index,
);

const USER_AGENT =
  "HavenOS/0.1 (local resource discovery; https://github.com/swhennen85/HavenOS)";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

const categoryFilters = {
  shelter: [
    '["amenity"~"^(shelter)$"]',
    '["social_facility"~"^(shelter)$"]',
  ],

  food: [
    '["amenity"~"^(food_bank|soup_kitchen)$"]',
    '["social_facility"~"^(food_bank)$"]',
  ],

  healthcare: [
    '["amenity"~"^(clinic|hospital|doctors)$"]',
    '["healthcare"~"^(clinic|hospital|doctor|centre)$"]',
  ],

  housing: [
    '["social_facility"~"^(shelter|assisted_living)$"]',
  ],

  hygiene: [
    '["amenity"~"^(shower|public_bath)$"]',
  ],

  legal: [
    '["office"="lawyer"]',
  ],

  employment: [
    '["office"="employment_agency"]',
  ],

  transportation: [
    '["amenity"~"^(bus_station|shelter)$"]',
    '["public_transport"="station"]',
  ],

  benefits: [
    '["social_facility"~"^(outreach|food_bank)$"]',
  ],

  community: [
    '["amenity"="community_centre"]',
    '["social_facility"~"^(community_centre|outreach)$"]',
    '["amenity"="place_of_worship"]',
  ],

  other: [
    '["amenity"~"^(shelter|food_bank|soup_kitchen|clinic|hospital|doctors|community_centre|shower)$"]',
    '["social_facility"~"^(shelter|food_bank|outreach|community_centre)$"]',
    '["office"~"^(lawyer|employment_agency)$"]',
  ],
};

// --------------------------------------------------
// HTTP / JSON HELPERS
// --------------------------------------------------

function sendJson(res, status, data) {
  if (res.headersSent) return;

  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });

  res.end(JSON.stringify(data));
}

async function readBody(req, maxBytes = 256_000) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > maxBytes) {
      throw new Error("Request body is too large.");
    }

    chunks.push(chunk);
  }

  return JSON.parse(
    Buffer.concat(chunks).toString("utf8"),
  );
}

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value ?? "[]");
  } catch {
    return fallback;
  }
}

// --------------------------------------------------
// DATABASE RESOURCE MAPPING
// --------------------------------------------------

function mapResource(row) {
  return {
    id: row.service_id,
    name: row.service_name,
    description: row.service_description,
    category: row.category,

    organization: {
      id: row.organization_id,
      name: row.organization_name,
      description: row.organization_description,
      website: row.website,
      phone: row.phone,
    },

    address: {
      street: row.street,
      city: row.city,
      county: row.county,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
    },

    coordinates:
      row.latitude == null || row.longitude == null
        ? null
        : {
            latitude: row.latitude,
            longitude: row.longitude,
          },

    hoursText: row.hours_text,
    accessibility: parseJson(row.accessibility_json),
    languages: parseJson(row.languages_json),
    eligibility: parseJson(row.eligibility_json),
    intakeInstructions: row.intake_instructions,
    cost: row.cost,
    verificationStatus: row.verification_status,

    source: row.source_name
      ? {
          name: row.source_name,
          url: row.source_url,
          retrievedAt: row.source_retrieved_at,
        }
      : null,
  };
}

const resourceSelect = `
  SELECT
    s.id AS service_id,
    s.name AS service_name,
    s.description AS service_description,
    s.category,
    s.eligibility_json,
    s.intake_instructions,
    s.cost,
    s.verification_status,

    o.id AS organization_id,
    o.name AS organization_name,
    o.description AS organization_description,
    o.website,
    o.phone,

    l.street,
    l.city,
    l.county,
    l.state,
    l.postal_code,
    l.country,
    l.latitude,
    l.longitude,
    l.hours_text,
    l.accessibility_json,
    l.languages_json,

    rs.name AS source_name,
    rs.url AS source_url,
    rs.retrieved_at AS source_retrieved_at

  FROM services s

  JOIN service_locations sl
    ON sl.service_id = s.id

  JOIN locations l
    ON l.id = sl.location_id

  JOIN organizations o
    ON o.id = l.organization_id

  LEFT JOIN resource_sources rs
    ON rs.id = (
      SELECT rs2.id
      FROM resource_sources rs2
      WHERE rs2.service_id = s.id
      ORDER BY rs2.retrieved_at DESC
      LIMIT 1
    )
`;

// --------------------------------------------------
// LOCATION GEOCODING
// --------------------------------------------------

let lastGeocodeRequestAt = 0;

async function geocodeLocation(location) {
  const queryKey = location
    .trim()
    .toLocaleLowerCase("en-US");

  const cached = db.prepare(`
    SELECT display_name, latitude, longitude
    FROM geocode_cache
    WHERE query_key = ?
  `).get(queryKey);

  if (cached) {
    return {
      displayName: cached.display_name,
      lat: cached.latitude,
      lon: cached.longitude,
      cached: true,
    };
  }

  // Public Nominatim usage:
  // User-triggered searches, identifying User-Agent,
  // caching, and at most one request per second.

  const waitMs = Math.max(
    0,
    1100 - (Date.now() - lastGeocodeRequestAt),
  );

  if (waitMs) {
    await new Promise(resolve =>
      setTimeout(resolve, waitMs),
    );
  }

  lastGeocodeRequestAt = Date.now();

  const url = new URL(NOMINATIM_URL);

  url.searchParams.set("q", location);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Location lookup service returned HTTP ${response.status}.`,
    );
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const result = results[0];

  const point = {
    displayName: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
    cached: false,
  };

  if (
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lon)
  ) {
    throw new Error(
      "Location lookup returned invalid coordinates.",
    );
  }

  db.prepare(`
    INSERT INTO geocode_cache (
      query_key,
      display_name,
      latitude,
      longitude,
      bounding_box_json
    )
    VALUES (?, ?, ?, ?, ?)

    ON CONFLICT(query_key) DO UPDATE SET
      display_name = excluded.display_name,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      bounding_box_json = excluded.bounding_box_json,
      retrieved_at = datetime('now')
  `).run(
    queryKey,
    point.displayName,
    point.lat,
    point.lon,
    JSON.stringify(result.boundingbox || []),
  );

  return point;
}

// --------------------------------------------------
// OPENSTREETMAP CATEGORY DETECTION
// --------------------------------------------------

function inferCategory(tags, requested) {
  if (requested && requested !== "other") {
    return requested;
  }

  const amenity = tags.amenity || "";
  const social = tags.social_facility || "";
  const office = tags.office || "";
  const healthcare = tags.healthcare || "";

  if (
    amenity === "shelter" ||
    social === "shelter"
  ) return "shelter";

  if (
    ["food_bank", "soup_kitchen"].includes(amenity) ||
    social === "food_bank"
  ) return "food";

  if (
    ["clinic", "hospital", "doctors"].includes(amenity) ||
    healthcare
  ) return "healthcare";

  if (
    amenity === "shower" ||
    amenity === "public_bath"
  ) return "hygiene";

  if (office === "lawyer") return "legal";

  if (office === "employment_agency") {
    return "employment";
  }

  if (
    amenity === "community_centre" ||
    social === "community_centre" ||
    amenity === "place_of_worship"
  ) return "community";

  if (social === "outreach") return "benefits";

  return "other";
}

function makeOverpassQuery(lat, lon, category) {
  const filters =
    categoryFilters[category] || categoryFilters.other;

  const selectors = filters
    .map(filter =>
      `nwr(around:6000,${lat},${lon})${filter};`,
    )
    .join("");

  return `[out:json][timeout:25];(${selectors});out center tags;`;
}

// --------------------------------------------------
// OPENSTREETMAP MULTI-ENDPOINT REQUEST
// --------------------------------------------------

async function requestOverpass(query) {
  const errors = [];

  for (const endpoint of OVERPASS_URLS) {
    try {
      console.log(
        `Trying OpenStreetMap source: ${endpoint}`,
      );

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "application/json",
        },

        body: new URLSearchParams({
          data: query,
        }),

        signal: AbortSignal.timeout(35000),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const detail = responseText.slice(0, 300);

        errors.push(
          `${endpoint}: HTTP ${response.status} ${detail}`,
        );

        console.warn(
          `Overpass endpoint failed (${response.status}): ${endpoint}`,
        );

        continue;
      }

      let payload;

      try {
        payload = JSON.parse(responseText);
      } catch {
        errors.push(
          `${endpoint}: Invalid JSON response.`,
        );

        continue;
      }

      if (!Array.isArray(payload.elements)) {
        errors.push(
          `${endpoint}: Missing elements array.`,
        );

        continue;
      }

      console.log(
        `OpenStreetMap discovery succeeded: ${endpoint}`,
      );

      return {
        payload,
        endpoint,
      };

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      errors.push(`${endpoint}: ${message}`);

      console.warn(
        `Overpass endpoint unavailable: ${endpoint}`,
        message,
      );
    }
  }

  throw new Error(
    "All OpenStreetMap discovery endpoints failed. " +
    errors.join(" | "),
  );
}

// --------------------------------------------------
// OPENSTREETMAP RESULT NORMALIZATION
// --------------------------------------------------

function candidateFromElement(element, requestedCategory) {
  const tags = element.tags || {};

  const name =
    tags.name ||
    tags["name:en"];

  if (!name) return null;

  const center = element.center || element;

  const lat = Number(center.lat);
  const lon = Number(center.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const street = [
    tags["addr:housenumber"],
    tags["addr:street"],
  ].filter(Boolean).join(" ");

  const address = {
    street: street || null,

    city:
      tags["addr:city"] ||
      tags["addr:town"] ||
      tags["addr:village"] ||
      tags["addr:suburb"] ||
      null,

    state: tags["addr:state"] || null,
    postalCode: tags["addr:postcode"] || null,
    country: tags["addr:country"] || "US",
  };

  const osmType = element.type;

  const sourceUrl =
    `https://www.openstreetmap.org/${osmType}/${element.id}`;

  return {
    id: `osm-${osmType}-${element.id}`,
    source: "OpenStreetMap",
    sourceRecordId: `${osmType}/${element.id}`,
    sourceUrl,
    name,

    category: inferCategory(
      tags,
      requestedCategory,
    ),

    latitude: lat,
    longitude: lon,
    address,

    phone:
      tags.phone ||
      tags["contact:phone"] ||
      null,

    website:
      tags.website ||
      tags["contact:website"] ||
      null,

    hours: tags.opening_hours || null,
    tags,
    verificationStatus: "discovered",
  };
}

// --------------------------------------------------
// OPENSTREETMAP DISCOVERY
// --------------------------------------------------

async function discoverResources(location, category) {
  const point = await geocodeLocation(location);

  if (!point) {
    return {
      location: null,
      items: [],
      total: 0,
      message:
        "We couldn't locate that place. Try a city and state or a ZIP code.",
    };
  }

  const queryKey =
    `${category}:${point.lat.toFixed(4)}:${point.lon.toFixed(4)}`;

  const cachedSearch = db.prepare(`
    SELECT result_json, fetched_at
    FROM discovery_query_cache
    WHERE query_key = ?
  `).get(queryKey);

  if (
    cachedSearch &&
    Date.now() - Date.parse(cachedSearch.fetched_at + "Z") <
      15 * 60 * 1000
  ) {
    const cachedResult = JSON.parse(
      cachedSearch.result_json,
    );

    return {
      ...cachedResult,
      cached: true,
    };
  }

  const query = makeOverpassQuery(
    point.lat,
    point.lon,
    category,
  );

  // This helper tries each endpoint in sequence.
  // It returns the first valid Overpass response.
  const { payload, endpoint } =
    await requestOverpass(query);

  // Only one payload and one candidates declaration.
  const candidates = payload.elements
    .map(element =>
      candidateFromElement(element, category),
    )
    .filter(Boolean);

  console.log(
    `Discovered ${candidates.length} places using ${endpoint}`,
  );

  // Save discovered places without overwriting
  // published HavenOS service records.

  const save = db.prepare(`
    INSERT INTO discovery_candidates (
      id,
      source_name,
      source_record_id,
      name,
      category,
      latitude,
      longitude,
      address_json,
      tags_json,
      source_url,
      discovered_at
    )
    VALUES (
      ?,
      'OpenStreetMap',
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      datetime('now')
    )

    ON CONFLICT(source_name, source_record_id)
    DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      address_json = excluded.address_json,
      tags_json = excluded.tags_json,
      source_url = excluded.source_url,
      discovered_at = datetime('now')
  `);

  db.exec("BEGIN");

  try {
    for (const item of candidates) {
      save.run(
        item.id,
        item.sourceRecordId,
        item.name,
        item.category,
        item.latitude,
        item.longitude,
        JSON.stringify(item.address),
        JSON.stringify(item.tags),
        item.sourceUrl,
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  const result = {
    location: point.displayName,

    center: {
      latitude: point.lat,
      longitude: point.lon,
    },

    radiusMeters: 6000,
    items: candidates,
    total: candidates.length,

    message: candidates.length
      ? "These are mapped places, not confirmed service availability. Contact each provider before travelling."
      : "No matching mapped places were found in this search area. Try another category or use the external directories.",
  };

  db.prepare(`
    INSERT INTO discovery_query_cache (
      query_key,
      result_json,
      fetched_at
    )
    VALUES (?, ?, datetime('now'))

    ON CONFLICT(query_key) DO UPDATE SET
      result_json = excluded.result_json,
      fetched_at = datetime('now')
  `).run(
    queryKey,
    JSON.stringify(result),
  );

  return result;
}

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

async function handleApi(req, res, url) {

  // HEALTH CHECK

  if (
    req.method === "GET" &&
    url.pathname === "/api/health"
  ) {
    return sendJson(res, 200, {
      ok: true,
      database: "sqlite",
      status: "connected",
    });
  }

  // LOCAL HAVENOS RESOURCE DIRECTORY

  if (
    req.method === "GET" &&
    url.pathname === "/api/resources"
  ) {
    const terms = (
      url.searchParams.get("q") || ""
    ).trim().slice(0, 120);

    const category = (
      url.searchParams.get("category") || ""
    ).trim();

    const location = (
      url.searchParams.get("location") || ""
    ).trim().slice(0, 120);

    const limit = Math.min(
      Math.max(
        Number(url.searchParams.get("limit") || 30),
        1,
      ),
      100,
    );

    const offset = Math.max(
      Number(url.searchParams.get("offset") || 0),
      0,
    );

    const clauses = [
      "s.is_published = 1",
      "s.verification_status <> 'closed'",
    ];

    const params = [];

    if (category) {
      clauses.push("s.category = ?");
      params.push(category);
    }

    if (terms) {
      clauses.push(`
        (
          s.name LIKE ?
          OR s.description LIKE ?
          OR o.name LIKE ?
          OR o.description LIKE ?
        )
      `);

      const pattern = `%${terms}%`;

      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
      );
    }

    if (location) {
      clauses.push(`
        (
          l.city LIKE ?
          OR l.county LIKE ?
          OR l.state LIKE ?
          OR l.postal_code LIKE ?
        )
      `);

      const pattern = `%${location}%`;

      params.push(
        pattern,
        pattern,
        pattern,
        pattern,
      );
    }

    const where = clauses.join(" AND ");

    const joins = `
      FROM services s

      JOIN service_locations sl
        ON sl.service_id = s.id

      JOIN locations l
        ON l.id = sl.location_id

      JOIN organizations o
        ON o.id = l.organization_id
    `;

    const count = db.prepare(`
      SELECT COUNT(*) AS total
      ${joins}
      WHERE ${where}
    `).get(...params).total;

    const rows = db.prepare(`
      ${resourceSelect}

      WHERE ${where}

      ORDER BY
        CASE s.verification_status
          WHEN 'verified' THEN 0
          WHEN 'pending' THEN 1
          ELSE 2
        END,
        o.name

      LIMIT ?
      OFFSET ?
    `).all(
      ...params,
      limit,
      offset,
    );

    return sendJson(res, 200, {
      items: rows.map(mapResource),
      total: count,
      limit,
      offset,
    });
  }

  // OPENSTREETMAP DISCOVERY

  if (
    req.method === "GET" &&
    url.pathname === "/api/discover"
  ) {
    const location = (
      url.searchParams.get("location") || ""
    ).trim().slice(0, 120);

    const category = (
      url.searchParams.get("category") || "other"
    ).trim();

    if (!location) {
      return sendJson(res, 400, {
        error: "A city, state, or ZIP code is required.",
      });
    }

    if (!Object.hasOwn(categoryFilters, category)) {
      return sendJson(res, 400, {
        error: "Unsupported resource category.",
      });
    }

    try {
      const result = await discoverResources(
        location,
        category,
      );

      return sendJson(res, 200, result);

    } catch (error) {
      console.error(
        "Resource discovery error:",
        error,
      );

      return sendJson(res, 502, {
        error:
          error instanceof Error
            ? error.message
            : "External resource discovery is temporarily unavailable.",

        fallbackAvailable: true,
      });
    }
  }

  // INDIVIDUAL RESOURCE

  const resourceMatch = url.pathname.match(
    /^\/api\/resources\/([a-zA-Z0-9_-]+)$/,
  );

  if (
    req.method === "GET" &&
    resourceMatch
  ) {
    const row = db.prepare(`
      ${resourceSelect}

      WHERE s.id = ?
        AND s.is_published = 1
        AND s.verification_status <> 'closed'

      LIMIT 1
    `).get(resourceMatch[1]);

    if (!row) {
      return sendJson(res, 404, {
        error: "Resource not found.",
      });
    }

    return sendJson(res, 200, {
      item: mapResource(row),
    });
  }

  // COMMUNITY / PROVIDER SUBMISSIONS

  if (
    req.method === "POST" &&
    url.pathname === "/api/submissions"
  ) {
    let payload;

    try {
      payload = await readBody(req);
    } catch (error) {
      return sendJson(res, 400, {
        error:
          error instanceof Error
            ? error.message
            : "Invalid JSON.",
      });
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return sendJson(res, 400, {
        error: "A submission object is required.",
      });
    }

    const serialized = JSON.stringify(payload);

    if (serialized.length > 50_000) {
      return sendJson(res, 413, {
        error: "Submission is too large.",
      });
    }

    const id = randomUUID();

    db.prepare(`
      INSERT INTO submissions (
        id,
        submitter_type,
        payload_json
      )
      VALUES (?, ?, ?)
    `).run(
      id,
      payload.submitterType === "provider"
        ? "provider"
        : "community",
      serialized,
    );

    return sendJson(res, 201, {
      id,
      status: "pending",
      message:
        "Your contribution has been queued for review.",
    });
  }

  return sendJson(res, 404, {
    error: "API route not found.",
  });
}

// --------------------------------------------------
// HTTP SERVER
// --------------------------------------------------

let vite;

const httpServer = createServer(
  async (req, res) => {

    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );

    // All API routes are handled by HavenOS,
    // never by Vite's HTML fallback.

    if (url.pathname.startsWith("/api/")) {
      try {
        await handleApi(req, res, url);

      } catch (error) {
        console.error(
          "HavenOS API error:",
          error,
        );

        sendJson(res, 500, {
          error:
            error instanceof Error
              ? error.message
              : "The server could not complete the request.",
        });
      }

      return;
    }

    // DEVELOPMENT: Vite middleware

    if (!production) {
      vite.middlewares(req, res);
      return;
    }

    // PRODUCTION: Serve built frontend

    const dist = path.join(root, "dist");

    let requested;

    try {
      requested = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      res.end("Invalid URL");
      return;
    }

    const candidate = path.resolve(
      dist,
      `.${requested}`,
    );

    const safe =
      candidate.startsWith(dist + path.sep) ||
      candidate === path.join(dist, "index.html");

    const file =
      safe &&
      existsSync(candidate) &&
      statSync(candidate).isFile()
        ? candidate
        : path.join(dist, "index.html");

    if (!existsSync(file)) {
      res.writeHead(404);
      res.end("Build not found. Run npm run build first.");
      return;
    }

    res.writeHead(200, {
      "content-type":
        mimeTypes[path.extname(file)] ||
        "application/octet-stream",

      "x-content-type-options": "nosniff",
    });

    createReadStream(file).pipe(res);
  },
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

if (!production) {
  const {
    createServer: createViteServer,
  } = await import("vite");

  vite = await createViteServer({
    server: {
      middlewareMode: true,
    },

    appType: "spa",
  });
}

httpServer.listen(
  port,
  "127.0.0.1",
  () => {
    console.log(
      `HavenOS ${production ? "production" : "development"} server: http://127.0.0.1:${port}`,
    );

    console.log(
      `SQLite database: ${path.join(dataDir, "havenos.sqlite")}`,
    );

    console.log(
      `OpenStreetMap endpoints configured: ${OVERPASS_URLS.length}`,
    );
  },
);
