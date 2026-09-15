"use client";

/**
 * Formulario de acceso al área del alumno.
 *
 * Regla que manda en los mensajes: nunca confirmar si un correo está o no
 * registrado. Ante credenciales incorrectas se responde siempre igual, exista
 * la cuenta o no. Better Auth ya devuelve el mismo código en ambos casos
 * (INVALID_EMAIL_OR_PASSWORD); aquí solo hay que no estropearlo.
 *
 * La única excepción es el correo sin verificar: ese error solo aparece
 * cuando la contraseña ya era correcta, así que quien lo ve es la persona
 * dueña de la cuenta. Ahí sí conviene explicar qué pasa.
 */

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Icon } from "./icon";
import { site } from "@/content/site";

type Errores = { email?: string; password?: string };

export function FormularioAcceso() {
  const router = useRouter();
  const idEmail = useId();
  const idPassword = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [avisoGeneral, setAvisoGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): Errores {
    const nuevos: Errores = {};
    if (!email.trim()) nuevos.email = "Escribe tu correo electrónico.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nuevos.email = "Ese correo no parece completo. Revisa que incluya la arroba y el dominio.";
    if (!password) nuevos.password = "Escribe tu contraseña.";
    return nuevos;
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAvisoGeneral(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.status === 403) {
          setAvisoGeneral(
            `Tu correo todavía no está verificado y el envío de verificación aún no está en marcha. Llama al ${site.phone} o escribe a ${site.email} y lo activamos desde el centro.`,
          );
        } else if (error.status === 429) {
          setAvisoGeneral("Has hecho demasiados intentos seguidos. Espera un minuto y vuelve a probar.");
        } else {
          setAvisoGeneral("El correo o la contraseña no son correctos. Compruébalos y vuelve a intentarlo.");
        }
        return;
      }

      router.push("/area-cliente/panel");
      router.refresh();
    } catch {
      setAvisoGeneral("No hemos podido conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={alEnviar} noValidate>
      {avisoGeneral && (
        <p className="form-alert" role="alert">
          {avisoGeneral}
        </p>
      )}

      <div className="form-field">
        <label className="form-label" htmlFor={idEmail}>
          Correo electrónico
        </label>
        <input
          className="form-input"
          id={idEmail}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errores.email ? true : undefined}
          aria-describedby={errores.email ? `${idEmail}-error` : undefined}
        />
        {errores.email && (
          <p className="form-error" id={`${idEmail}-error`}>
            {errores.email}
          </p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor={idPassword}>
          Contraseña
        </label>
        <input
          className="form-input"
          id={idPassword}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errores.password ? true : undefined}
          aria-describedby={errores.password ? `${idPassword}-error` : undefined}
        />
        {errores.password && (
          <p className="form-error" id={`${idPassword}-error`}>
            {errores.password}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button className="button button-blue" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
          <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
