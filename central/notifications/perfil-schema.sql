CREATE TABLE IF NOT EXISTS perfiles_personales(matricula TEXT PRIMARY KEY,payload TEXT NOT NULL CHECK(json_valid(payload)),updated_at TEXT NOT NULL);
