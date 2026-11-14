CREATE TABLE IF NOT EXISTS historial_faltas(carga TEXT NOT NULL REFERENCES historial_cargas(id),matricula TEXT NOT NULL,fecha TEXT NOT NULL,concepto TEXT NOT NULL,PRIMARY KEY(carga,matricula,fecha));
CREATE INDEX IF NOT EXISTS historial_faltas_fecha ON historial_faltas(carga,fecha,matricula);
CREATE TABLE IF NOT EXISTS faltas_anteriores(id TEXT PRIMARY KEY,matricula TEXT NOT NULL,fecha TEXT NOT NULL,estado TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE INDEX IF NOT EXISTS faltas_anteriores_matricula ON faltas_anteriores(matricula,fecha);
