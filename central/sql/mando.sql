CREATE TABLE IF NOT EXISTS nomina_mando_fuentes(id TEXT PRIMARY KEY,quincena TEXT NOT NULL,nombre TEXT NOT NULL,fecha TEXT NOT NULL,conteos TEXT NOT NULL CHECK(json_valid(conteos)));
CREATE TABLE IF NOT EXISTS nomina_mando(matricula TEXT PRIMARY KEY,fuente TEXT NOT NULL REFERENCES nomina_mando_fuentes(id),json TEXT NOT NULL CHECK(json_valid(json)));
CREATE TABLE IF NOT EXISTS nomina_mando_historial(fuente TEXT NOT NULL REFERENCES nomina_mando_fuentes(id),matricula TEXT NOT NULL,json TEXT NOT NULL CHECK(json_valid(json)),PRIMARY KEY(fuente,matricula));
