/**
 * Textos legales, redactados con los datos reales de la sociedad.
 *
 * Descripción honesta de lo que la web hace HOY: páginas informativas, enlaces
 * de contacto y un área de alumnos con el registro cerrado. No se describen
 * funciones que no existen ni tratamientos que no se realizan.
 *
 * Sigue siendo recomendable una revisión por asesoría jurídica antes de abrir
 * el registro: hay datos de menores desde 6 años de por medio y quien responde
 * es la titular, no quien desarrolla.
 */
import { empresa, site } from "./site";

export type Bloque = { titulo: string; parrafos: readonly string[] };

export const avisoLegal: readonly Bloque[] = [
  {
    titulo: "Titular de esta web",
    parrafos: [
      `${empresa.razonSocial}, con CIF ${empresa.cif}, es la titular de este sitio web. Su domicilio está en ${empresa.domicilioFiscal}, ${empresa.codigoPostal} ${empresa.municipio}.`,
      `Puedes escribirnos a ${empresa.correoTitular} o llamar al ${site.phone}.`,
      empresa.registroMercantil
        ? `Inscrita en el Registro Mercantil: ${empresa.registroMercantil}.`
        : "Los datos de inscripción en el Registro Mercantil se añadirán en cuanto estén disponibles.",
    ],
  },
  {
    titulo: "A qué nos dedicamos",
    parrafos: [
      `Somos una asesoría de transportes, un centro de formación y una autoescuela en ${empresa.municipio}.`,
      `Centro de formación homologado para el CAP con el número ${empresa.homologacionCap}. Autoescuela con el número de registro ${empresa.registroAutoescuela}.`,
      `Disponemos de seguro de responsabilidad civil con ${empresa.aseguradoraRC}.`,
    ],
  },
  {
    titulo: "Qué puedes hacer en esta web",
    parrafos: [
      "Consultar nuestros servicios, horarios y datos de contacto, y acceder a los servicios externos que ya utilizas, como la descarga de la tarjeta de tacógrafo.",
      "Desde la web no se contrata, no se matricula ni se paga nada. Las fechas, plazas, precios y condiciones se confirman siempre hablando con el centro.",
      "El área de alumnos está en preparación: el registro todavía no está abierto.",
    ],
  },
  {
    titulo: "Enlaces a otras páginas",
    parrafos: [
      "Algunos enlaces llevan a servicios de otras empresas, como la plataforma de descarga de tarjetas o el mapa de Google. Esas páginas tienen sus propias condiciones y no dependen de nosotros.",
      "Si un enlace deja de funcionar o te lleva a un sitio que no esperabas, avísanos y lo revisamos.",
    ],
  },
  {
    titulo: "Contenidos de la web",
    parrafos: [
      "Los textos, imágenes y el logotipo de esta web son de la titular o se usan con su autorización. No pueden reproducirse con fines comerciales sin permiso.",
      "Cuidamos de que la información esté al día, pero puede contener errores o quedarse desactualizada. Antes de tomar una decisión, confírmalo con nosotros.",
    ],
  },
];

export const privacidad: readonly Bloque[] = [
  {
    titulo: "Quién trata tus datos",
    parrafos: [
      `${empresa.razonSocial}, CIF ${empresa.cif}, con domicilio en ${empresa.domicilioFiscal}, ${empresa.codigoPostal} ${empresa.municipio}.`,
      `Para cualquier cuestión sobre tus datos, escribe a ${empresa.correoTitular}.`,
    ],
  },
  {
    titulo: "Qué datos recogemos y para qué",
    parrafos: [
      "Si nos llamas, nos escribes o nos mandas un WhatsApp, tratamos los datos que nos facilites para atender tu consulta. Esta web no tiene formularios de envío: los enlaces abren tu teléfono o tu programa de correo.",
      "Si eres alumno o alumna, tratamos tus datos para gestionar tu formación: matrícula, seguimiento y asistencia. La base para ello es la relación que mantenemos contigo y las obligaciones que nos impone la normativa de formación y transporte.",
      "Cuando el área de alumnos esté abierta, tratará el nombre, el correo, el teléfono y la fecha de nacimiento que facilites al crear la cuenta.",
    ],
  },
  {
    titulo: "Alumnos menores de edad",
    parrafos: [
      "Impartimos clases de apoyo a partir de los 6 años, así que buena parte del alumnado es menor.",
      "La ley española no permite que un menor de 14 años autorice por sí mismo el uso de sus datos. Por eso, en esos casos la cuenta del área de alumnos es del padre, madre o tutor, que es quien la crea y quien autoriza.",
      "Como hasta ahora, seguimos pidiendo la autorización firmada por los padres o tutores para el alumnado menor de edad.",
      "Si eres padre, madre o tutor y quieres saber qué datos tenemos de tu hijo o hija, o quieres que los eliminemos, escríbenos y lo resolvemos.",
    ],
  },
  {
    titulo: "Quién puede ver tus datos",
    parrafos: [
      "Dentro del centro, solo el personal de administración accede a los datos personales.",
      "No vendemos ni cedemos datos a terceros. Solo acceden a ellos las empresas que nos prestan servicios técnicos necesarios, como el alojamiento de la web o el envío de correos de la cuenta, y únicamente para eso.",
      "Cuando una obligación legal nos exija comunicar datos a la Administración, lo haremos.",
    ],
  },
  {
    titulo: "Cuánto tiempo los guardamos",
    parrafos: [
      "Las consultas, el tiempo necesario para atenderlas.",
      "Los datos de alumnos, mientras dure la formación y después durante los plazos que exige la normativa aplicable, por si hay que justificar la actividad ante la Administración.",
      "Cuando dejan de ser necesarios, los eliminamos.",
    ],
  },
  {
    titulo: "Qué puedes pedirnos",
    parrafos: [
      "Puedes pedirnos acceder a tus datos, corregirlos, eliminarlos, limitar su uso, oponerte a determinados tratamientos o recibirlos en un archivo.",
      `Para ejercer cualquiera de estos derechos, escribe a ${empresa.correoTitular} indicando qué necesitas. Podemos pedirte que acredites tu identidad, para asegurarnos de no entregar datos a quien no corresponde.`,
      "Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos.",
    ],
  },
  {
    titulo: "Cookies y mapas",
    parrafos: [
      "Esta web no utiliza cookies de publicidad ni de analítica.",
      "Las páginas de inicio y de contacto muestran un mapa de Google. Al cargarse, tu navegador se conecta con Google, que recibe datos técnicos de esa conexión, como tu dirección IP. Si prefieres evitarlo, puedes consultar la dirección sin abrir el mapa: está escrita justo al lado.",
    ],
  },
];
