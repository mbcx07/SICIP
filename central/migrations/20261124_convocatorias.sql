CREATE TABLE IF NOT EXISTS convocatorias(id TEXT PRIMARY KEY,plaza TEXT NOT NULL,inicio TEXT NOT NULL,fin TEXT NOT NULL,fecha_emision TEXT NOT NULL,payload TEXT NOT NULL,hash TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS convocatorias_plaza ON convocatorias(plaza,inicio);
