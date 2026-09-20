-- Conversación de Telegram a la que el bot manda los avisos.
--
-- Vive en la base y no en el .env por dos razones. La primera es práctica: el
-- centro tiene que poder cambiarla sin llamar a nadie ni entrar por SSH. La
-- segunda es que un cambio de grupo no debería exigir reiniciar el contenedor
-- y cortar el servicio.
--
-- El token del bot NO va aquí: ese sigue en el .env, que es donde deben estar
-- los secretos. Aquí solo va el destino, que no es secreto.
CREATE TABLE IF NOT EXISTS "telegram_enlace" (
  -- Candado de fila única. Es siempre 1, y el CHECK impide que sea otra cosa:
  -- dos filas significarían dos destinos y ninguna forma de saber cuál vale.
  "id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
  "chat_id" text,
  "chat_titulo" text,
  "chat_tipo" text,
  "vinculado_en" timestamp with time zone,
  "vinculado_por" text,
  "ultimo_envio_en" timestamp with time zone,
  "ultimo_error" text,
  CONSTRAINT "telegram_una_sola_fila" CHECK ("id" = 1)
);

-- Se crea ya la fila vacía: así el resto del código siempre lee algo y no hay
-- que distinguir entre "no configurado" y "fila que no existe".
INSERT INTO "telegram_enlace" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;
