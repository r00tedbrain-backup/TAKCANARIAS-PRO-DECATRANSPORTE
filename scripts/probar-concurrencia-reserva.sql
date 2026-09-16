-- Prueba: dos alumnos van a por la misma plaza en el mismo instante.
--
-- Reproduce lo que hace la aplicación al reservar: bloquear la fila del hueco,
-- contar las plazas tomadas y, solo si queda sitio, insertar.
--
-- El pg_sleep está puesto a propósito entre el bloqueo y el recuento. Sin el
-- FOR UPDATE, esa pausa es justo el hueco por el que se cuela la segunda
-- transacción: ambas leerían "0 tomadas" y ambas insertarían. Con el bloqueo,
-- la segunda espera a que la primera termine y entonces ya lee "1 tomada".
--
-- Se invoca con:  psql -v alumno="'<id>'" -f este-fichero.sql

BEGIN;

SELECT plazas FROM sesion_clase WHERE id = 'HUECO-PRUEBA' FOR UPDATE;

SELECT pg_sleep(3);

INSERT INTO reserva (alumno_id, sesion_id, estado)
SELECT :alumno, 'HUECO-PRUEBA', 'activa'
WHERE (
    SELECT count(*) FROM reserva
    WHERE sesion_id = 'HUECO-PRUEBA' AND estado = 'activa'
  ) < (
    SELECT plazas FROM sesion_clase WHERE id = 'HUECO-PRUEBA'
  );

COMMIT;
