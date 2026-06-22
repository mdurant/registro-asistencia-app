-- Mi Asistencia App — Esquema SQLite v1

CREATE TABLE IF NOT EXISTS users (
  rut TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_last4 TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('colaborador', 'supervisor', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supermarkets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commune TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  geofence_radius_m INTEGER NOT NULL DEFAULT 200
);

CREATE TABLE IF NOT EXISTS user_supermarkets (
  user_rut TEXT NOT NULL,
  supermarket_id TEXT NOT NULL,
  PRIMARY KEY (user_rut, supermarket_id),
  FOREIGN KEY (user_rut) REFERENCES users(rut),
  FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id)
);

CREATE TABLE IF NOT EXISTS linked_devices (
  id TEXT PRIMARY KEY,
  user_rut TEXT NOT NULL,
  phone_number TEXT,
  serial TEXT,
  imei TEXT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  os_name TEXT NOT NULL,
  os_version TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  linked_at TEXT NOT NULL,
  FOREIGN KEY (user_rut) REFERENCES users(rut)
);

CREATE TABLE IF NOT EXISTS device_link_audit (
  id TEXT PRIMARY KEY,
  user_rut TEXT NOT NULL,
  old_device_id TEXT,
  new_device_id TEXT,
  action TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_rut) REFERENCES users(rut)
);

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  user_rut TEXT NOT NULL,
  session_id TEXT NOT NULL,
  recorded_at_local TEXT NOT NULL,
  timezone TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  location_accuracy_m REAL,
  ip_address TEXT,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_os TEXT NOT NULL,
  device_serial TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_at TEXT,
  server_id TEXT,
  integrity_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_rut) REFERENCES users(rut)
);

CREATE TABLE IF NOT EXISTS attendance_events (
  id TEXT PRIMARY KEY,
  user_rut TEXT NOT NULL,
  supermarket_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('INGRESO', 'SALIDA')),
  recorded_at_local TEXT NOT NULL,
  timezone TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  location_accuracy_m REAL,
  ip_address TEXT,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_os TEXT NOT NULL,
  device_serial TEXT,
  photo_uri TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_at TEXT,
  server_id TEXT,
  integrity_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_rut) REFERENCES users(rut),
  FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_rut TEXT PRIMARY KEY,
  biometric_enabled INTEGER NOT NULL DEFAULT 0,
  permissions_completed INTEGER NOT NULL DEFAULT 0,
  device_alert_sent INTEGER NOT NULL DEFAULT 0,
  theme TEXT DEFAULT 'light',
  FOREIGN KEY (user_rut) REFERENCES users(rut)
);

CREATE TABLE IF NOT EXISTS email_queue (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  template_type TEXT NOT NULL,
  metadata_json TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_events(user_rut, recorded_at_local);
CREATE INDEX IF NOT EXISTS idx_attendance_sync ON attendance_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_login_sync ON login_events(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_linked_devices_user ON linked_devices(user_rut, is_active);
