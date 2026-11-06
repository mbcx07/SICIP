CREATE TABLE IF NOT EXISTS pd44_tabuladores(id TEXT PRIMARY KEY,quincena TEXT NOT NULL,nombre TEXT NOT NULL,hash TEXT NOT NULL,datos TEXT NOT NULL CHECK(json_valid(datos)),fuente TEXT NOT NULL,source_hash TEXT NOT NULL,referencia TEXT NOT NULL,actor TEXT NOT NULL,fecha TEXT NOT NULL,UNIQUE(quincena,hash));
CREATE INDEX IF NOT EXISTS pd44_tab_qna ON pd44_tabuladores(quincena,fecha);
