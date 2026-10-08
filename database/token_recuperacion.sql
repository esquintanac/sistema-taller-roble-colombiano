-- database/token_recuperacion.sql
-- Tabla de enlaces de recuperación de contraseña.
--
-- Se ejecuta UNA sola vez contra la base "mydb", por ejemplo:
--   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -padmin mydb < database/token_recuperacion.sql
--
-- Diseño de seguridad: el token de recuperación NO se guarda en claro,
-- solo su hash SHA-256 en token_hash (64 caracteres hexadecimales).
-- Si la base de datos se filtrara, el enlace siguiendo no se puede reconstruir.
-- El modelo Django correspondiente es managed=False: el esquema se lleva
-- con este script, igual que las tablas heredadas del proyecto.

CREATE TABLE IF NOT EXISTS token_recuperacion (
    id_token   INT        NOT NULL AUTO_INCREMENT,
    id_usuario INT        NOT NULL,
    token_hash CHAR(64)   NOT NULL,
    creado_en  DATETIME   NOT NULL,
    expira_en  DATETIME   NOT NULL,
    usado      TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_token),
    KEY idx_token_hash (token_hash),
    CONSTRAINT fk_token_recuperacion_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
