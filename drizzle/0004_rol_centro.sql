-- Rol de la cuenta: "alumno" o "centro".
--
-- Por defecto todo el mundo es alumno. La única forma de que alguien sea del
-- centro es ponérselo aquí a mano, con un UPDATE. Ni el registro ni ninguna
-- pantalla lo tocan: si el alta pudiera fijarlo, bastaría con añadir un campo
-- al formulario para darse permisos a uno mismo.

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "rol" text DEFAULT 'alumno' NOT NULL;
