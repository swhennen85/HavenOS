PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  street TEXT,
  city TEXT NOT NULL,
  county TEXT,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  latitude REAL,
  longitude REAL,
  hours_text TEXT,
  accessibility_json TEXT NOT NULL DEFAULT '[]',
  languages_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'shelter','food','healthcare','housing','hygiene','legal',
    'employment','transportation','benefits','community','other'
  )),
  eligibility_json TEXT NOT NULL DEFAULT '[]',
  intake_instructions TEXT,
  cost TEXT NOT NULL DEFAULT 'unknown'
    CHECK (cost IN ('free','paid','sliding-scale','unknown')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('discovered','unverified','pending','verified','stale','closed')),
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_locations (
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, location_id)
);

CREATE TABLE IF NOT EXISTS resource_sources (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  retrieved_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_history (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitter_type TEXT NOT NULL DEFAULT 'community',
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','reviewing','accepted','rejected')),
  review_notes TEXT
);

CREATE TABLE IF NOT EXISTS discovery_candidates (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  latitude REAL,
  longitude REAL,
  address_json TEXT NOT NULL DEFAULT '{}',
  tags_json TEXT NOT NULL DEFAULT '{}',
  source_url TEXT NOT NULL,
  discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_name, source_record_id)
);

CREATE TABLE IF NOT EXISTS geocode_cache (
  query_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  bounding_box_json TEXT,
  retrieved_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS discovery_query_cache (
  query_key TEXT PRIMARY KEY,
  result_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state);
CREATE INDEX IF NOT EXISTS idx_locations_postal ON locations(postal_code);
CREATE INDEX IF NOT EXISTS idx_locations_county_state ON locations(county, state);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_services_category_published ON services(category, is_published);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(verification_status);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_candidates_category ON discovery_candidates(category);
CREATE INDEX IF NOT EXISTS idx_candidates_location ON discovery_candidates(latitude, longitude);
