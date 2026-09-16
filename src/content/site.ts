/**
 * Datos de la sociedad, facilitados por la titular el 15/09/2026.
 *
 * El número de póliza del seguro de responsabilidad civil NO se publica: no
 * existe obligación de hacerlo y exponerlo no aporta nada al visitante. Consta
 * en la documentación interna del proyecto.
 *
 * Falta por confirmar la inscripción registral (tomo, folio y hoja). Hasta
 * recibirla, la página de aviso legal lo indica en lugar de inventarla.
 */
export const empresa = {
  razonSocial: "Takcanarias S.L.",
  formaJuridica: "Sociedad de responsabilidad limitada",
  cif: "B76294420",
  domicilioFiscal: "Calle Pintor Nicolás Massieu, 6",
  codigoPostal: "35018",
  municipio: "Las Palmas de Gran Canaria",
  correoTitular: "direccion@takcanarias.es",
  registroMercantil: null as string | null,
  homologacionCap: "2725",
  registroAutoescuela: "GC0308",
  aseguradoraRC: "Hiscox",
} as const;

export const site = {
  name: "Takcanarias",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.takcanarias.es",
  phone: "828 024 990",
  phoneHref: "tel:+34828024990",
  whatsapp: "https://wa.me/34609365012",
  email: "administracion@takcanarias.es",
  address: "Calle Pintor Nicolás Massieu, 6",
  locality: "Lomo los Frailes · Las Palmas de Gran Canaria",
  postalCode: "35018",
  hours: "Lunes a viernes, 08:30–20:00",
  gps: "https://takcanarias.app-gps.es",
  cardDownload: "https://tachomat.app.vdo-fleet.com/connect/insert-card",
  instagram: "https://www.instagram.com/takcanarias/",
  maps: "https://www.google.com/maps/search/?api=1&query=Calle+Pintor+Nicolas+Massieu+6+35018+Las+Palmas+de+Gran+Canaria",
  mapEmbed: "https://maps.google.com/maps?q=calle%20pintor%20nicolas%20massieu%2C%206%20las%20palmas%20de%20gran%20canaria&t=m&z=18&output=embed&iwloc=near",
} as const;

export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  headline: string;
  introduction: string;
  image: string;
  imageAlt: string;
  items: readonly { title: string; description: string }[];
  questions: readonly { question: string; answer: string }[];
  contactLabel: string;
  contactHref: string;
};

export const services: readonly Service[] = [
  {
    slug: "asesoria-transportes",
    title: "Gestión de tacógrafos y asesoría",
    shortTitle: "Asesoría y tacógrafos",
    summary: "Análisis, descarga y custodia de datos. Un equipo para acompañar a tu empresa de transporte.",
    headline: "Tu transporte, con las cosas claras.",
    introduction: "Te acompañamos en la gestión del tacógrafo y en tus consultas en materia de transporte. Atención directa para profesionales y empresas, desde nuestro centro en Las Palmas de Gran Canaria.",
    image: "/images/tacografo.webp",
    imageAlt: "Imagen de un camión y un tacógrafo utilizada en la web de Takcanarias",
    items: [
      { title: "Análisis y control", description: "Tratamiento de los datos del tacógrafo para revisar la actividad y disponer de informes." },
      { title: "Descarga de datos", description: "Acceso directo a Tachomat, la herramienta de VDO para descargar los datos de la tarjeta del conductor e imprimir el recibo." },
      { title: "Informes y custodia", description: "Organización y custodia de los datos. Consulta con el equipo el alcance del servicio para tu empresa." },
      { title: "Asesoramiento cercano", description: "Cuéntanos qué necesitas revisar. Te orientamos en materia de transportes y formación profesional." },
    ],
    questions: [
      { question: "¿Dónde descargo mi tarjeta?", answer: "Pulsa «Descargar tarjeta en VDO» para abrir Tachomat directamente. La descarga se realiza en la plataforma de VDO, no en esta web. Si necesitas ayuda con el equipo o el lector, contacta con asesoría." },
      { question: "¿Puedo acceder a la plataforma GPS?", answer: "Sí. Conservamos el acceso a la plataforma GPS de Takcanarias. Necesitarás las credenciales facilitadas por el equipo." },
    ],
    contactLabel: "Hablar con asesoría",
    contactHref: "tel:+34657898928",
  },
  {
    slug: "formacion-cap",
    title: "Formación CAP",
    shortTitle: "Formación CAP",
    summary: "Formación para profesionales del transporte. Mercancías y viajeros, en horario continuo o de fin de semana.",
    headline: "La formación que sigue tu camino.",
    introduction: "Centro homologado CAP nº 2725, según la información publicada por Takcanarias. Formación para transporte de mercancías y viajeros, con modalidades de horario continuo y de fin de semana.",
    image: "/images/aula.webp",
    imageAlt: "Aula con mesas, pizarra y rótulo de Takcanarias",
    items: [
      { title: "Mercancías", description: "Consulta la formación CAP y la próxima convocatoria que corresponde a tu situación profesional." },
      { title: "Viajeros", description: "Formación CAP para profesionales del transporte de viajeros. Te ayudamos a identificar el curso que necesitas." },
      { title: "Horario continuo", description: "Una opción para organizar tu formación durante la semana. Fechas y plazas mediante consulta al centro." },
      { title: "Fin de semana", description: "Consulta las convocatorias de fin de semana para compatibilizar el curso con tu actividad." },
    ],
    questions: [
      { question: "¿Cuándo empieza el próximo curso?", answer: "El calendario se confirma directamente con formación. Llámanos o escríbenos para consultar fechas, plazas, horarios y precio antes de inscribirte." },
      { question: "¿Los cursos son online?", answer: "El aula online está prevista como parte de la nueva web. No está abierta todavía. Consulta la modalidad disponible y los requisitos de asistencia del curso concreto." },
      { question: "¿Habrá registro de asistencia?", answer: "La futura área del alumno contempla el seguimiento de la asistencia a cursos. Mientras se prepara, consulta con el centro cómo se gestiona la asistencia de tu convocatoria." },
    ],
    contactLabel: "Consultar próximos cursos",
    contactHref: "mailto:formacion@takcanarias.es",
  },
  {
    slug: "autoescuela-takcanarias",
    title: "Autoescuela Takcanarias",
    shortTitle: "Autoescuela",
    summary: "De las primeras dudas a tus primeras prácticas. Aprende a conducir con apoyo y atención personal.",
    headline: "Tu siguiente paso tiene volante.",
    introduction: "Aprender a conducir es mucho más que preparar un examen. En nuestra autoescuela encontrarás profesores que te acompañan, resuelven tus dudas y te ayudan a avanzar con confianza.",
    image: "/images/autoescuela.webp",
    imageAlt: "Dos Toyota Yaris rotulados con la marca Autoescuela Takcanarias",
    items: [
      { title: "Preparación teórica", description: "Consulta las opciones de preparación y el material disponible. Un profesor te orientará sobre cómo organizar tu aprendizaje." },
      { title: "Clases prácticas", description: "Atención personal para trabajar la conducción y ganar seguridad al volante. Consulta horarios y disponibilidad con el centro." },
      { title: "Recuperación de puntos", description: "Solicita información sobre los cursos de puntos. El centro te confirmará la convocatoria, los requisitos y la modalidad que corresponde a tu caso." },
      { title: "Tu futura área de alumno", description: "Estamos preparando un espacio para reservar clases y consultar el seguimiento de tus prácticas. Mientras tanto, las gestiones se realizan con el equipo." },
    ],
    questions: [
      { question: "¿Cómo puedo empezar?", answer: "Contacta con el centro para conocer los permisos disponibles, los requisitos de matrícula, las tarifas y las opciones de horario." },
      { question: "¿Puedo reservar prácticas desde la web?", answer: "Todavía no. La reserva de agenda forma parte de la futura área del alumno. Por ahora, habla directamente con la autoescuela para acordar tus clases." },
    ],
    contactLabel: "Consultar con la autoescuela",
    contactHref: site.whatsapp,
  },
  {
    slug: "clases-de-apoyo",
    title: "Clases de apoyo",
    shortTitle: "Apoyo escolar",
    summary: "Refuerzo de las asignaturas troncales y específicas, desde Primaria hasta Bachillerato, e inglés. Grupos reducidos, tareas, exámenes y hábitos de estudio.",
    headline: "Cada alumno aprende a su manera.",
    introduction: "Refuerzo escolar a medida, desde Primaria hasta Bachillerato. Trabajamos las tareas, preparamos exámenes y ayudamos a construir hábitos de estudio, con comunicación directa con las familias.",
    image: "/images/centro.webp",
    imageAlt: "Espacio de enseñanza de Takcanarias con pizarra y mesas",
    items: [
      { title: "Atención individualizada", description: "Adaptamos el apoyo a las necesidades del alumno y a los contenidos de su centro de estudios." },
      { title: "Grupos reducidos", description: "Un entorno que permite prestar atención a las dudas y al progreso de cada estudiante." },
      { title: "Tareas y exámenes", description: "Control diario de tareas, ejercicios de refuerzo y preparación de exámenes para afianzar los conocimientos." },
      { title: "Comunicación con las familias", description: "Contacto directo y fluido con padres y madres para acompañar juntos el aprendizaje." },
    ],
    questions: [
      { question: "¿Qué niveles y asignaturas se imparten?", answer: "Apoyo en asignaturas troncales y específicas de Primaria, Secundaria/ESO y Bachillerato, además de inglés. Indícanos el curso y la materia que necesitas reforzar para confirmar el grupo y la disponibilidad." },
      { question: "¿Cómo consulto una plaza?", answer: "Llama al departamento de clases en el 663 232 358 o escribe a clases@takcanarias.es. Te informaremos de los grupos, horarios y tarifas disponibles." },
      { question: "¿Se sigue el trabajo del colegio o instituto?", answer: "Sí. El apoyo se adapta a las necesidades del alumno y de su centro de estudios: tareas del día, contenidos que necesita repasar y preparación de sus exámenes." },
      { question: "¿Cómo participa la familia?", answer: "Mantenemos una comunicación directa y fluida con padres y madres para acompañar el aprendizaje. Consulta con el departamento de clases cómo se organiza el seguimiento." },
    ],
    contactLabel: "Consultar clases de apoyo",
    contactHref: "tel:+34663232358",
  },
];

export const futureModules = [
  { slug: "deca", title: "DeCA para tu empresa", description: "El Documento Electrónico de Control Administrativo, integrado en el entorno de Takcanarias.", features: ["Acceso para cada empresa", "Gestión de documentos de transporte", "Consulta y descarga de documentos"], note: "Estamos preparando la integración del servicio DeCA. El acceso y la generación de documentos no están disponibles en esta web todavía." },
  { slug: "cursos", title: "Tu formación, también online", description: "Un aula conectada con tu centro, para continuar aprendiendo estés donde estés.", features: ["Acceso a tus cursos", "Materiales y seguimiento del aprendizaje", "Consulta de asistencia"], note: "El aula online está en preparación. Las modalidades, convocatorias y condiciones de cada curso se confirmarán antes de su apertura." },
  // "area-cliente" ya no está aquí: dejó de ser un módulo en preparación cuando
  // el acceso, el panel y las reservas pasaron a funcionar. Su página vive ahora
  // en src/app/area-cliente/page.tsx.
] as const;
