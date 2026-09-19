/**
 * Artículos del blog.
 *
 * El contenido va en bloques tipados y no en HTML suelto. Así el texto no
 * puede romper la maquetación ni colar etiquetas, y el día que cambie el
 * diseño se cambia en un sitio en vez de en cada artículo.
 *
 * REGLA PARA QUIEN AÑADA ARTÍCULOS: aquí no se escribe nada que no se pueda
 * respaldar. Cuando se habla de normativa, plazos u obligaciones, la fuente va
 * enlazada y citada con su referencia. Un dato legal inventado en la web de una
 * asesoría de transportes no es un error de estilo: es un cliente que se cree
 * cubierto y se lleva la multa.
 */

export type Bloque =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "titulo"; texto: string; id: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; puntos: string[] }
  | { tipo: "lista-numerada"; puntos: string[] }
  | { tipo: "destacado"; texto: string }
  | { tipo: "tabla"; cabeceras: string[]; filas: string[][] }
  | { tipo: "cita"; texto: string; fuente: string }
  | { tipo: "llamada"; texto: string; enlace: { texto: string; url: string } };

export type Fuente = { titulo: string; referencia: string; url: string };

export type Articulo = {
  slug: string;
  titulo: string;
  /** Para la etiqueta <title> y los buscadores. Más literal que el titular. */
  tituloSeo: string;
  descripcion: string;
  /** Frase de entrada que resume el artículo entero. */
  entradilla: string;
  publicado: string;
  actualizado?: string;
  minutosLectura: number;
  etiquetas: string[];
  bloques: Bloque[];
  fuentes: Fuente[];
};

export const articulos: Articulo[] = [
  {
    slug: "deca-documento-control-digital-obligatorio-2026",
    titulo: "El DeCA, explicado sin rodeos: qué cambia el 5 de octubre de 2026",
    tituloSeo: "DeCA obligatorio el 5 de octubre de 2026: qué es y a quién afecta",
    descripcion:
      "Desde el 5 de octubre de 2026 el documento de control del transporte público de mercancías tiene que ser digital. Qué es el DeCA, a quién obliga, qué datos lleva y qué enseña el conductor en un control.",
    entradilla:
      "El papel deja de valer para el documento de control. Explicamos qué exige exactamente la norma, quién queda fuera y qué hay que tener listo antes de esa fecha.",
    publicado: "2026-09-19",
    minutosLectura: 9,
    etiquetas: ["Transporte de mercancías", "Normativa", "Digitalización"],
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "El 5 de octubre de 2026, el documento de control administrativo que se lleva a bordo en el transporte público de mercancías por carretera deja de poder ser de papel. Pasa a ser obligatoriamente digital, y de ahí sus siglas: DeCA, documento electrónico de control administrativo.",
      },
      {
        tipo: "parrafo",
        texto:
          "No es un trámite nuevo ni un impuesto encubierto. El documento de control existe desde hace años y ya era obligatorio llevarlo. Lo único que cambia es el soporte: donde antes valía un papel rellenado a boli, ahora hace falta un fichero generado por una aplicación.",
      },
      {
        tipo: "destacado",
        texto:
          "No hay periodo de gracia. El Ministerio lo dice con estas palabras: no está prevista ninguna fase adicional, más allá del 5 de octubre, en la que no se sancione la obligación de digitalización.",
      },

      { tipo: "titulo", texto: "De dónde sale esta obligación", id: "de-donde-sale" },
      {
        tipo: "parrafo",
        texto:
          "La fecha no la fija una circular ni una recomendación del sector: está en una ley. La disposición transitoria octava de la Ley 9/2025, de 3 de diciembre, de Movilidad Sostenible da diez meses desde su entrada en vigor para que el documento sea necesariamente digital. Esos diez meses se cumplen el 5 de octubre de 2026.",
      },
      {
        tipo: "cita",
        texto:
          "El Documento de control administrativo exigible para la realización de transporte público de mercancías por carretera, regulado en la Orden FOM/2861/2012, de 13 de diciembre, deberá ser necesariamente digital a los diez meses desde la entrada en vigor de esta ley.",
        fuente: "Ley 9/2025, de 3 de diciembre, de Movilidad Sostenible, disposición transitoria octava",
      },
      {
        tipo: "parrafo",
        texto:
          "La misma disposición hace lo propio con la hoja de ruta del transporte público de viajeros. Si tienes autobuses, también te toca, aunque el documento y sus datos sean otros.",
      },
      {
        tipo: "parrafo",
        texto:
          "Los detalles técnicos —cómo tiene que ser el fichero, qué lleva dentro, cómo lo consulta un agente en carretera— están en la Resolución de 5 de junio de 2026 de la Dirección General de Transporte por Carretera y Ferrocarril, publicada en el BOE del 12 de junio. Esa resolución deja sin efecto la anterior, la de 22 de mayo de 2023.",
      },

      { tipo: "titulo", texto: "A quién obliga y a quién no", id: "a-quien-obliga" },
      {
        tipo: "parrafo",
        texto:
          "Aquí es donde más dudas hay, y donde más fácil es equivocarse en los dos sentidos: creerse obligado sin estarlo, o creerse libre y no estarlo.",
      },
      {
        tipo: "subtitulo",
        texto: "Sí estás obligado",
      },
      {
        tipo: "lista",
        puntos: [
          "Si haces transporte público de mercancías por carretera dentro de España, es decir, con origen y destino en territorio español.",
          "Si haces cabotaje en territorio español.",
          "Si ya venías haciendo el documento de control en papel, ahora te toca hacerlo en electrónico.",
        ],
      },
      {
        tipo: "subtitulo",
        texto: "No estás obligado",
      },
      {
        tipo: "lista",
        puntos: [
          "Transporte privado complementario: si mueves mercancía propia como apoyo a tu actividad principal, el DeCA no te aplica. Sí debes llevar documentación que acredite que la mercancía es tuya y que vehículo y conductor están integrados en tu empresa.",
          "Transporte internacional: se rige por los convenios firmados por España, no por el DeCA. Y ojo con una confusión extendida: el eCMR NO pasa a ser obligatorio el 5 de octubre.",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "A eso hay que sumarle las exenciones que el artículo 2 de la Orden FOM/2861/2012 ya tenía para el documento en papel, y que siguen igual. Son cuatro, y la de las mudanzas se nos pasa a todos:",
      },
      {
        tipo: "lista",
        puntos: [
          "Transportes que no necesitan título habilitante de la Administración.",
          "Transportes de mudanza.",
          "Transportes de vehículos accidentados o averiados en vehículos especiales.",
          "Paquetería y servicios similares: envíos de pocos bultos que una persona pueda manejar sola con lo que lleve el vehículo.",
        ],
      },
      {
        tipo: "destacado",
        texto:
          "La regla corta: la digitalización no cambia quién tiene que hacer el documento. Quien no lo hacía en papel, sigue sin hacerlo. Quien lo hacía, ahora lo hace en electrónico.",
      },

      { tipo: "titulo", texto: "Qué datos lleva el DeCA", id: "que-datos-lleva" },
      {
        tipo: "parrafo",
        texto:
          "Los mismos que llevaba el documento en papel, los del artículo 6 de la Orden FOM/2861/2012. Lo interesante es que la responsabilidad está repartida: no todo es del transportista.",
      },
      {
        tipo: "tabla",
        cabeceras: ["Dato", "De quién es la responsabilidad"],
        filas: [
          ["Nombre o razón social, NIF y domicilio del cargador contractual", "Cargador contractual"],
          ["Nombre o razón social y NIF del transportista efectivo", "Cargador contractual"],
          ["Lugar de origen y destino del envío", "Cargador contractual"],
          ["Naturaleza y peso de la mercancía", "Cargador contractual"],
          ["Autorización especial de circulación, si el vehículo la necesita", "Transportista efectivo"],
          ["Fecha de realización del transporte", "Transportista efectivo"],
          ["Matrícula del vehículo (y del remolque, si es un conjunto)", "Transportista efectivo"],
          ["Observaciones o reservas, si alguna parte las pide", "Quien las solicite"],
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Sobre quién genera materialmente el documento, la norma no lo impone: el artículo 4 dice que cargador contractual y transportista efectivo están ambos obligados a formalizarlo, y el artículo 7 añade que los dos responden si no viaja a bordo. El cargador queda eximido solo si prueba que el documento fue emitido.",
      },
      {
        tipo: "parrafo",
        texto:
          "Si subcontratas, conviene tener claros los papeles: el transportista que realiza materialmente el porte es el transportista efectivo, y quien le subcontrata pasa a ser el cargador contractual, aunque también sea transportista.",
      },

      { tipo: "titulo", texto: "Cómo tiene que ser el fichero", id: "como-es-el-fichero" },
      {
        tipo: "parrafo",
        texto:
          "Aquí está la parte que más gente pasa por alto, y la que convierte en inválido un documento que a simple vista parece correcto.",
      },
      {
        tipo: "lista-numerada",
        puntos: [
          "Es un PDF de menos de 5 MB, con la fecha y hora de creación guardadas como datos del propio fichero.",
          "Tiene que ser nativo digital. Escanear el papel de siempre o hacerle una foto NO vale, y esto es lo que más sorprende a quien creía que con digitalizar el albarán bastaba.",
          "Lleva dentro un código QR con la dirección web del documento.",
          "Se genera antes de que empiece el servicio, no durante ni después.",
          "Se guarda en un repositorio del que se pueda descargar durante el viaje.",
          "Se conserva al menos un año.",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "La dirección web tiene sus propias exigencias, y son estrictas: debe empezar por https, y al abrirla tiene que descargarse el PDF directamente. No vale que lleve a una página con usuario y contraseña, ni con botones de descarga, ni nada que obligue a hacer clic. Un agente en la carretera escanea el QR y el documento tiene que caer solo.",
      },
      {
        tipo: "parrafo",
        texto:
          "Pasados siete días naturales desde que termina el servicio, esa descarga se puede desactivar. El fichero hay que seguir guardándolo un año, pero ya no tiene que estar accesible desde el enlace.",
      },

      { tipo: "titulo", texto: "Qué enseña el conductor en un control", id: "en-un-control" },
      {
        tipo: "parrafo",
        texto:
          "Antes de que arranque el servicio hay que entregarle al conductor una copia. Puede ser en el móvil o en papel, pero en los dos casos tiene que verse el código QR. En el control, presenta el DeCA con su QR o, si no, solo el QR.",
      },
      {
        tipo: "destacado",
        texto:
          "Si el conductor lleva la copia impresa, lo que escriba a mano encima no cuenta. La norma solo admite dos formas de modificar un DeCA, y ninguna es un bolígrafo.",
      },
      {
        tipo: "parrafo",
        texto:
          "Si hay que cambiar algo con el camión ya en ruta, hay dos caminos. Uno: modificar el PDF existente, añadiendo los datos nuevos y el motivo, dejando los viejos marcados como no válidos; el enlace y el QR siguen sirviendo. Dos: generar un PDF nuevo, que tendrá otra dirección y otro QR, conservando el original. En ambos casos hay que hacerle llegar el documento actualizado al conductor.",
      },

      { tipo: "titulo", texto: "Tres confusiones que estamos oyendo", id: "confusiones" },
      {
        tipo: "subtitulo",
        texto: "«Hay que registrarse en una plataforma del Ministerio»",
      },
      {
        tipo: "parrafo",
        texto:
          "No. El DeCA no es una aplicación del Ministerio y no hay que subir los documentos a ningún sitio oficial. Cada empresa usa su propia aplicación o contrata a un proveedor. Tampoco hay que comunicar el dominio donde se guardan: la resolución de junio de 2026 eliminó ese requisito que sí existía antes.",
      },
      {
        tipo: "subtitulo",
        texto: "«La aplicación tiene que estar certificada»",
      },
      {
        tipo: "parrafo",
        texto:
          "Tampoco. El propio Ministerio aclara que esa idea viene de confundirlo con las plataformas eFTI, que son otra cosa y esas sí se certificarán.",
      },
      {
        tipo: "subtitulo",
        texto: "«Hay que firmar el documento»",
      },
      {
        tipo: "parrafo",
        texto:
          "No es obligatorio firmarlo. Si aun así se firma —por ejemplo, porque el documento se usa también como contrato—, entonces la firma debe ser electrónica avanzada o cualificada según el reglamento europeo eIDAS. Una firma avanzada no exige certificado digital: valen métodos como el código de un solo uso o la firma biométrica.",
      },

      { tipo: "titulo", texto: "Qué hacer antes del 5 de octubre", id: "que-hacer" },
      {
        tipo: "lista-numerada",
        puntos: [
          "Comprueba si te afecta. Si haces transporte público de mercancías en España y hoy rellenas documento de control, te afecta.",
          "Decide con qué lo vas a emitir: una aplicación propia o un proveedor. Tiene que generar el PDF nativo, con QR y enlace de descarga directa.",
          "Habla con tus cargadores habituales. El documento lo formalizáis los dos, así que conviene acordar quién lo genera en cada operación.",
          "Prepara a los conductores. Tienen que saber que ahora enseñan un QR y que escribir a mano en la copia impresa no sirve de nada.",
          "Haz una prueba real antes de la fecha, no el mismo día. Genera un DeCA, escanea el QR con otro móvil y comprueba que el PDF se descarga solo.",
        ],
      },
      {
        tipo: "llamada",
        texto:
          "En Takcanarias emitimos el DeCA con miDeCApro. Te damos de alta, lo dejamos funcionando y te acompañamos con el primero, que es el que cuesta.",
        enlace: { texto: "Empezar con miDeCApro", url: "/deca" },
      },
      {
        tipo: "parrafo",
        texto:
          "Y si prefieres que te lo expliquemos con calma antes de decidir nada, llámanos o pásate por el centro. Preferimos dedicarte un rato ahora que resolverte un problema en carretera dentro de un mes.",
      },
    ],
    fuentes: [
      {
        titulo: "Documento electrónico de Control Administrativo (DeCA) y preguntas frecuentes",
        referencia: "Ministerio de Transportes y Movilidad Sostenible",
        url: "https://www.transportes.gob.es/transporte-terrestre/profesionales-transporte/servicios-transportista/documento-electronico-control-administrativo-deca",
      },
      {
        titulo:
          "Resolución de 5 de junio de 2026, por la que se establecen las características que deben reunir los sistemas y los documentos electrónicos de control administrativo",
        referencia: "BOE-A-2026-12784, «BOE» núm. 143, de 12 de junio de 2026",
        url: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-12784",
      },
      {
        titulo: "Ley 9/2025, de 3 de diciembre, de Movilidad Sostenible",
        referencia: "Disposición transitoria octava",
        url: "https://www.boe.es/buscar/doc.php?id=BOE-A-2025-24545",
      },
      {
        titulo:
          "Orden FOM/2861/2012, por la que se regula el documento de control administrativo exigible para el transporte público de mercancías",
        referencia:
          "BOE-A-2013-154. Texto consolidado: artículos 2 (exenciones), 4 (obligados), 6 (contenido) y 7 (responsabilidad)",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2013-154",
      },
      {
        titulo: "Real Decreto 1211/1990, Reglamento de la Ley de Ordenación de los Transportes Terrestres",
        referencia: "Artículo 222",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1990-24442",
      },
    ],
  },
];

export const articulosPorFecha = [...articulos].sort((a, b) => b.publicado.localeCompare(a.publicado));

export function buscarArticulo(slug: string): Articulo | undefined {
  return articulos.find((a) => a.slug === slug);
}
