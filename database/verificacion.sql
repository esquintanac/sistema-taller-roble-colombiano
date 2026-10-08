-- database/verificacion.sql
-- Tabla única de artefactos de verificación de identidad.
--
-- RNF: "Todo mecanismo de verificación de identidad debe aplicar las mismas
-- garantías de seguridad (expiración, límite de intentos, uso único),
-- independientemente del canal o propósito." Un solo motor
-- (VerificacionService) y una sola tabla sirven para los tres propósitos:
--   'login'        -> código de 6 dígitos (segundo factor tras credenciales)
--   'registro'     -> código de 6 dígitos que confirma la propiedad del correo
--   'recuperacion' -> token largo que viaja dentro del enlace de restablecer
--
-- Se ejecuta UNA sola vez contra la base "mydb", por ejemplo:
--   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -padmin mydb < database/verificacion.sql
--
-- Diseño de seguridad: el artefacto (código o token) NUNCA se guarda en
-- claro, solo su hash SHA-256 en valor_hash (64 caracteres hexadecimales).
-- Si la base de datos se filtrara, ni los códigos enviados ni los enlaces
-- vigentes se pueden reconstruir.
--
-- Esta tabla unificada reemplaza el uso de 'token_recuperacion' (que
-- quedaba sin propósito una vez unificado el motor); su script se conserva
-- por trazabilidad de la evidencia.
--
-- id_usuario es anulable (NULL) a propósito: en 'registro' el artefacto se
-- emite ANTES de crear la cuenta, y en 'recuperacion' se registra la
-- solicitud incluso cuando no existe la cuenta, para que el cooldown de
-- reenvío se comporte igual con y sin cuenta (sin fugas por enumeración).
--
-- El modelo Django correspondiente es managed=False: el esquema se lleva
-- con este script, igual que las tablas heredadas del proyecto.

CREATE TABLE IF NOT EXISTS verificacion (
    id_verificacion INT         NOT NULL AUTO_INCREMENT,
    proposito       VARCHAR(20) NOT NULL,   -- 'login' | 'registro' | 'recuperacion'
    destino         VARCHAR(150) NOT NULL,  -- correo (canal activo hoy)
    id_usuario      INT         NULL,       -- NULL cuando la cuenta aún no existe
    valor_hash      CHAR(64)    NOT NULL,   -- SHA-256 del código o del token
    creado_en       DATETIME    NOT NULL,
    expira_en       DATETIME    NOT NULL,
    intentos        TINYINT     NOT NULL DEFAULT 0,
    usado           TINYINT(1)  NOT NULL DEFAULT 0,
    PRIMARY KEY (id_verificacion),
    KEY idx_proposito_destino (proposito, destino),
    KEY idx_valor_hash (valor_hash),
    CONSTRAINT fk_verificacion_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;