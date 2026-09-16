UPDATE "user" SET email_verified = true WHERE email LIKE '%@prueba.invalid';
UPDATE "user" SET rol = 'centro' WHERE email = 'jefe@prueba.invalid';
SELECT email || ' -> rol=' || rol AS quien FROM "user" WHERE email LIKE '%@prueba.invalid' ORDER BY 1;
