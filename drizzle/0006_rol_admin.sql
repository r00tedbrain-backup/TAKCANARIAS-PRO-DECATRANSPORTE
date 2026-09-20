-- Tercer rol: "admin", por encima de "centro".
--
-- Por qué separarlo. Si quien gestiona el día a día pudiera crear cuentas de
-- centro y restablecer contraseñas ajenas, robar UNA cuenta del personal
-- bastaría para fabricar más y quedarse dentro para siempre. Separando el
-- administrador, ese daño queda contenido: el personal gestiona alumnos, y
-- crear personal o cambiar roles es otra cosa.
--
-- El CHECK cierra los valores posibles. Hasta ahora "rol" era texto libre, así
-- que un UPDATE con "centrol" mal escrito dejaba a alguien sin permisos sin que
-- nada fallara: entraba, no veía el panel, y a averiguar por qué.
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_rol_valido";
ALTER TABLE "user" ADD CONSTRAINT "user_rol_valido"
  CHECK ("rol" IN ('alumno', 'centro', 'admin'));

-- Buscar por rol es constante en el panel (listar personal, contar admins).
CREATE INDEX IF NOT EXISTS "user_por_rol" ON "user" ("rol");
