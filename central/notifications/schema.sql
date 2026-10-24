CREATE TABLE IF NOT EXISTS contactos(matricula TEXT PRIMARY KEY,institucional TEXT NOT NULL DEFAULT '',personal TEXT NOT NULL DEFAULT '',institucional_verificado TEXT,personal_verificado TEXT,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notificaciones(id TEXT PRIMARY KEY,event_key TEXT UNIQUE NOT NULL,matricula TEXT NOT NULL,titulo TEXT NOT NULL,mensaje TEXT NOT NULL,url TEXT NOT NULL,fecha TEXT NOT NULL,leida TEXT,expandida INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS notificaciones_propias ON notificaciones(matricula,fecha);
CREATE TABLE IF NOT EXISTS push_suscripciones(id TEXT PRIMARY KEY,matricula TEXT NOT NULL,endpoint TEXT UNIQUE NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS push_owner ON push_suscripciones(matricula);
CREATE TABLE IF NOT EXISTS notificacion_envios(id TEXT PRIMARY KEY,notificacion TEXT,matricula TEXT NOT NULL,canal TEXT NOT NULL,destino TEXT NOT NULL,payload TEXT NOT NULL,estado TEXT NOT NULL DEFAULT 'PENDIENTE',intentos INTEGER NOT NULL DEFAULT 0,proximo INTEGER NOT NULL DEFAULT 0,lease TEXT,lease_until INTEGER NOT NULL DEFAULT 0,fecha TEXT NOT NULL,aceptado TEXT,error TEXT,UNIQUE(notificacion,canal,destino));
CREATE INDEX IF NOT EXISTS notificacion_cola ON notificacion_envios(estado,proximo,lease_until);
CREATE TABLE IF NOT EXISTS correo_verificaciones(matricula TEXT NOT NULL,tipo TEXT NOT NULL,correo TEXT NOT NULL,hash TEXT NOT NULL,expira INTEGER NOT NULL,intentos INTEGER NOT NULL DEFAULT 0,fecha INTEGER NOT NULL,PRIMARY KEY(matricula,tipo));
CREATE TABLE IF NOT EXISTS documentos_recibidos(folio TEXT PRIMARY KEY,tipo TEXT NOT NULL,registro TEXT NOT NULL,matricula TEXT NOT NULL,actor TEXT NOT NULL,fecha TEXT NOT NULL);
