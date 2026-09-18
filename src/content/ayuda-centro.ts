/**
 * Ayuda del panel del centro.
 *
 * Está escrita para quien va a usar esto todos los días, no para quien lo ha
 * programado: sin palabras de informática y explicando por qué las cosas
 * funcionan como funcionan, que es lo que evita las llamadas de "no entiendo
 * esto". Va aquí, separada de la pantalla, para poder corregir un texto sin
 * tocar el código.
 *
 * Cada apartado responde a una pregunta que se harán de verdad, en el orden en
 * que se la van a hacer la primera vez que entren.
 */

export type Apartado = {
  titulo: string;
  /** Una frase que resume. Se ve sin desplegar. */
  resumen: string;
  pasos?: string[];
  /** Lo que conviene saber antes de meter la pata. */
  avisos?: string[];
};

export const ayudaCentro: Apartado[] = [
  {
    titulo: "Por dónde empezar",
    resumen: "El orden importa: sin horario no hay horas, y sin horas nadie puede reservar.",
    pasos: [
      "Rellena el horario habitual de la semana: los días y las horas en que dais clase.",
      "Pulsa «Abrir horas» para crear las horas concretas de las próximas semanas.",
      "Da de alta a los alumnos. A cada uno le llegará un correo para entrar.",
      "A partir de ahí, ellos reservan solos y vosotros solo miráis quién viene.",
    ],
    avisos: [
      "Si abres horas antes de poner el horario, no se creará ninguna: se crean a partir de él.",
    ],
  },
  {
    titulo: "El horario de la semana",
    resumen: "Se describe una vez cómo es una semana normal y se repite sola.",
    pasos: [
      "Elige el tipo de clase, el día y de qué hora a qué hora.",
      "En «clases a la vez» pon cuántas podéis dar en esa franja. En prácticas, eso suele ser cuántos coches tenéis libres.",
      "Añade una franja por cada hueco. Si los lunes dais de cuatro a seis, son dos franjas: una de cuatro a cinco y otra de cinco a seis.",
    ],
    avisos: [
      "Esto no crea horas todavía: es la plantilla. Las horas se crean al pulsar «Abrir horas».",
      "Quitar una franja no borra las horas ya abiertas. Deja de crear nuevas, pero las que estén puestas siguen ahí y hay que anularlas una a una.",
    ],
  },
  {
    titulo: "Abrir horas para los alumnos",
    resumen: "Convierte el horario en horas concretas que los alumnos pueden coger.",
    pasos: [
      "Indica cuántas semanas quieres abrir por delante.",
      "Pulsa el botón. Se crean las horas de esas semanas a partir del horario.",
    ],
    avisos: [
      "Se puede pulsar todas las veces que haga falta: las horas que ya existan se quedan como están y no se duplican.",
      "Conviene hacerlo cada pocas semanas para que los alumnos siempre tengan fechas disponibles por delante.",
      "Solo se crean a partir de mañana. El día de hoy no se toca.",
    ],
  },
  {
    titulo: "Dar de alta a un alumno",
    resumen: "Creáis vosotros la cuenta y al alumno le llega un correo para elegir su contraseña.",
    pasos: [
      "Escribe el nombre y el correo. Comprueba bien el correo: ahí llega el enlace para entrar.",
      "Si el alumno es un niño, marca la casilla. La cuenta será del padre, madre o tutor, y el alumno queda colgando de ella.",
      "Pulsa «Crear cuenta y avisar». El alumno recibe el correo y ya puede entrar.",
    ],
    avisos: [
      "Nadie ve nunca la contraseña de un alumno, tampoco vosotros. Si la pierde, entra en «He olvidado mi contraseña» y le llega otro enlace.",
      "El enlace del correo caduca en una hora. Si se le pasa, que pida otro desde la pantalla de acceso; no hace falta crear la cuenta de nuevo.",
      "Una misma cuenta puede tener varios alumnos. Si una madre trae a dos hijos, se da de alta una vez y luego se añaden los hermanos.",
    ],
  },
  {
    titulo: "Por qué los niños no tienen cuenta propia",
    resumen: "La ley pide 14 años para que alguien autorice el uso de sus propios datos.",
    avisos: [
      "Por eso la cuenta es siempre de una persona adulta y los menores cuelgan de ella.",
      "Un niño de ocho años no puede tener cuenta, pero sí ficha de alumno: la abre su padre o su madre desde la suya.",
      "Cada alumno mantiene sus horas y su historial por separado, aunque compartan cuenta. Dos hermanos no se mezclan.",
    ],
  },
  {
    titulo: "Validar fichas",
    resumen: "Mientras una ficha esté sin validar, ese alumno no puede reservar.",
    pasos: [
      "Las fichas pendientes salen arriba del todo, en «Fichas por revisar».",
      "Comprueba que los datos cuadran con lo que tenéis y pulsa «Validar ficha».",
    ],
    avisos: [
      "Si la ficha es de un menor, marca la casilla de la autorización solo cuando la tengáis firmada de verdad. Esa casilla deja constancia de que existe ese papel.",
      "Las que dais de alta vosotros salen ya validadas. Solo hay que revisar las que se registren por su cuenta.",
    ],
  },
  {
    titulo: "Anular una hora",
    resumen: "Para un festivo, un coche en el taller o un profesor de baja.",
    pasos: [
      "Busca la hora en «Próximas horas».",
      "Escribe el motivo si quieres y pulsa «Anular esta hora».",
    ],
    avisos: [
      "Quien la tuviera reservada la verá marcada como anulada al entrar, con el motivo si lo has escrito.",
      "Aun así, llámale. Que lo vea en la web no garantiza que lo mire antes de presentarse.",
      "La hora no se borra: se queda marcada para saber qué pasó.",
    ],
  },
  {
    titulo: "Cuando un alumno anula",
    resumen: "Gratis con 24 horas de aviso y en horario de oficina. Fuera de eso, la práctica se puede cobrar.",
    avisos: [
      "La regla que aplica la web es la vuestra: anular sin coste exige avisar con 24 horas y hacerlo de lunes a viernes de 8:00 a 20:00. Un sábado no vale para anular la del lunes.",
      "Si el alumno anula fuera de plazo, la web NO se lo impide: la hora se libera igualmente, pero la anulación queda marcada y en el aviso que os llega pone claramente FUERA DE PLAZO. El cobro lo decidís y lo hacéis vosotros, como hasta ahora.",
      "Al alumno se le avisa antes de pulsar: en su pantalla ve que ya está fuera de plazo y que la práctica se puede cobrar. No puede alegar que no lo sabía.",
    ],
  },
  {
    titulo: "Quién viene",
    resumen: "Las reservas de aquí en adelante, con el alumno y la cuenta desde la que se hizo.",
    avisos: [
      "Podéis anular una reserva desde aquí si hace falta. La hora vuelve a quedar libre para otro alumno.",
      "Si anuláis vosotros, avisad al alumno: él no recibe llamada automática.",
    ],
  },
  {
    titulo: "Si dos alumnos van a por la misma hora",
    resumen: "No puede pasar: solo uno se la queda y al otro le sale aviso.",
    avisos: [
      "Aunque pulsen los dos en el mismo segundo, la hora es de uno solo. Está resuelto por debajo y no depende de que estéis vigilando.",
      "Cuando una hora se llena, deja de aparecer en la lista de los alumnos.",
    ],
  },
  {
    titulo: "Avisos cuando alguien reserva",
    resumen: "Podéis recibir un correo, o un mensaje de Telegram, cada vez que se coge o se anula una hora.",
    avisos: [
      "Hay que darnos el correo al que queréis que lleguen, o crear el grupo de Telegram. Hasta entonces no se envía nada.",
      "Por Telegram van solo el nombre de pila, el tipo de clase y la hora. Ni correos ni teléfonos: un grupo se reenvía y acaba en cualquier móvil. Los datos completos están aquí, detrás de vuestra contraseña.",
    ],
  },
  {
    titulo: "Quién puede entrar en esta pantalla",
    resumen: "Solo las cuentas marcadas como personal del centro.",
    avisos: [
      "Un alumno que escriba esta dirección no ve nada: se le manda a su propia área.",
      "Para que alguien del equipo entre aquí hay que darle permiso expresamente. Pídenoslo y lo hacemos.",
      "No compartáis una cuenta entre varias personas. Si cada uno tiene la suya, se sabe quién hizo cada cosa.",
    ],
  },
];
