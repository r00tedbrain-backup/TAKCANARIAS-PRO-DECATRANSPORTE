/**
 * Envío de correo del área de alumnos.
 *
 * Se envía desde un subdominio propio (`avisos.takcanarias.es`) y no desde el
 * dominio principal. Verificar el dominio principal en Resend obligaría a
 * modificar el registro SPF que usan los buzones del centro, y un error ahí
 * manda su correo de siempre a la carpeta de spam. Con el subdominio se añaden
 * registros nuevos sin tocar ni un valor de los existentes.
 *
 * Solo correos de servicio: verificar la cuenta y restablecer la contraseña.
 * Nada de avisos comerciales.
 */
import { Resend } from "resend";
import { empresa, site } from "@/content/site";

const REMITENTE = process.env.EMAIL_REMITENTE ?? "Takcanarias <no-responder@avisos.takcanarias.es>";

function cliente(): Resend {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) throw new Error("Falta la variable de entorno RESEND_API_KEY");
  return new Resend(clave);
}

/** Envoltura sobria y legible, sin imágenes ni rastreo. */
function plantilla(titulo: string, cuerpo: string, boton: { texto: string; url: string }): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#faf8f4;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#191e56">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #dcdfe8;border-radius:4px;padding:32px">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.18em;color:#585d6c">TAKCANARIAS</p>
    <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25">${titulo}</h1>
    ${cuerpo}
    <p style="margin:26px 0">
      <a href="${boton.url}" style="display:inline-block;padding:14px 22px;background:#223899;color:#fff;text-decoration:none;border-radius:4px;font-size:14px;font-weight:700">${boton.texto}</a>
    </p>
    <p style="margin:0 0 6px;font-size:12px;color:#585d6c">Si el botón no funciona, copia esta dirección en tu navegador:</p>
    <p style="margin:0 0 24px;font-size:12px;color:#223899;word-break:break-all">${boton.url}</p>
    <hr style="border:0;border-top:1px solid #dcdfe8;margin:0 0 16px">
    <p style="margin:0;font-size:12px;color:#585d6c">
      ${empresa.razonSocial} · ${empresa.domicilioFiscal}, ${empresa.codigoPostal} ${empresa.municipio}<br>
      ${site.phone} · ${empresa.correoTitular}
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#585d6c">
      Este mensaje se envía desde una dirección que no admite respuestas.
    </p>
  </div>
</body></html>`;
}

export async function enviarVerificacion(destinatario: string, nombre: string, url: string) {
  const { error } = await cliente().emails.send({
    from: REMITENTE,
    to: [destinatario],
    subject: "Confirma tu cuenta de Takcanarias",
    html: plantilla(
      `Hola, ${nombre}`,
      `<p style="margin:0;font-size:15px;line-height:1.7">Has creado una cuenta en el área de alumnos de Takcanarias. Confirma que esta dirección es tuya para poder entrar.</p>
       <p style="margin:12px 0 0;font-size:15px;line-height:1.7">Si no has sido tú, no hagas nada: sin confirmar, la cuenta no se activa.</p>`,
      { texto: "Confirmar mi cuenta", url },
    ),
    text: `Hola, ${nombre}.\n\nHas creado una cuenta en el área de alumnos de Takcanarias. Confirma tu dirección aquí:\n${url}\n\nSi no has sido tú, no hagas nada: sin confirmar, la cuenta no se activa.\n\n${empresa.razonSocial} · ${site.phone}`,
  });
  if (error) throw new Error(`No se pudo enviar el correo de verificación: ${error.message}`);
}

export async function enviarRestablecer(destinatario: string, nombre: string, url: string) {
  const { error } = await cliente().emails.send({
    from: REMITENTE,
    to: [destinatario],
    subject: "Cambiar tu contraseña de Takcanarias",
    html: plantilla(
      `Hola, ${nombre}`,
      `<p style="margin:0;font-size:15px;line-height:1.7">Has pedido cambiar la contraseña de tu cuenta. Este enlace caduca en una hora.</p>
       <p style="margin:12px 0 0;font-size:15px;line-height:1.7">Si no lo has pedido tú, puedes ignorar este mensaje: tu contraseña seguirá siendo la misma.</p>`,
      { texto: "Cambiar mi contraseña", url },
    ),
    text: `Hola, ${nombre}.\n\nHas pedido cambiar tu contraseña. Este enlace caduca en una hora:\n${url}\n\nSi no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.\n\n${empresa.razonSocial} · ${site.phone}`,
  });
  if (error) throw new Error(`No se pudo enviar el correo de cambio de contraseña: ${error.message}`);
}
