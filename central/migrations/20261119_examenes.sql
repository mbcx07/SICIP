CREATE TABLE IF NOT EXISTS examenes_resultados(id TEXT PRIMARY KEY,matricula TEXT NOT NULL,nombre TEXT NOT NULL,fecha INTEGER NOT NULL,payload TEXT NOT NULL,guardado TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS examenes_resultados_persona ON examenes_resultados(matricula,fecha,id);
