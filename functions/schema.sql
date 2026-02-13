-- D1 Schema for Multi-Tenant SaaS
-- Run: wrangler d1 execute <DB_NAME> --file=./schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  auth_provider_user_id TEXT NOT NULL UNIQUE,
  studio_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider_user_id ON users(auth_provider_user_id);
CREATE INDEX idx_users_studio_id ON users(studio_id);

-- Studios table
CREATE TABLE IF NOT EXISTS studios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  status TEXT NOT NULL CHECK(status IN ('active', 'grace', 'inactive')) DEFAULT 'inactive',
  plan_type TEXT CHECK(plan_type IN ('studio_monthly', 'studio_lifetime', 'bespoke')) DEFAULT NULL,
  stripe_customer_id TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_studios_status ON studios(status);
CREATE INDEX idx_studios_stripe_customer_id ON studios(stripe_customer_id);

-- Entitlements table
CREATE TABLE IF NOT EXISTS entitlements (
  studio_id TEXT PRIMARY KEY,
  is_active INTEGER NOT NULL DEFAULT 0, -- SQLite boolean as integer
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  current_period_end INTEGER,
  grace_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_entitlements_stripe_subscription_id ON entitlements(stripe_subscription_id);
CREATE INDEX idx_entitlements_grace_ends_at ON entitlements(grace_ends_at);

-- Styles table (studio-scoped)
CREATE TABLE IF NOT EXISTS styles (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_styles_studio_id ON styles(studio_id);

-- Room types table (studio-scoped)
CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_room_types_studio_id ON room_types(studio_id);

-- Images table (studio-scoped)
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  room_type TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_studio_id ON images(studio_id);
CREATE INDEX idx_images_is_active ON images(is_active);

-- Image styles junction table (many-to-many)
CREATE TABLE IF NOT EXISTS image_styles (
  image_id TEXT NOT NULL,
  style_id TEXT NOT NULL,
  PRIMARY KEY (image_id, style_id),
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
  FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE CASCADE
);

CREATE INDEX idx_image_styles_image_id ON image_styles(image_id);
CREATE INDEX idx_image_styles_style_id ON image_styles(style_id);

-- Projects table (studio-scoped)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  name TEXT NOT NULL,
  client_name TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_studio_id ON projects(studio_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Swipes table (studio-scoped)
CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY,
  studio_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('left', 'right')),
  response_time_ms INTEGER NOT NULL,
  undo_used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);

CREATE INDEX idx_swipes_studio_id ON swipes(studio_id);
CREATE INDEX idx_swipes_project_id ON swipes(project_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at);
