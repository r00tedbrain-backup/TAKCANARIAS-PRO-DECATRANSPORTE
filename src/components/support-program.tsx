import { Icon } from "./icon";

const methodology = [
  { title: "El apoyo se adapta al alumno", description: "Partimos de lo que necesita reforzar y de los contenidos que trabaja en su centro de estudios. La atención es personalizada: no todos los alumnos tienen las mismas dudas ni necesitan practicar lo mismo." },
  { title: "Tareas y práctica diaria", description: "Revisamos las tareas escolares y trabajamos ejercicios extra para afianzar lo aprendido. Los materiales de apoyo ayudan a comprender los contenidos de forma práctica, no solo a completar los deberes." },
  { title: "Exámenes y hábitos de estudio", description: "Preparamos los exámenes repasando los contenidos y resolviendo las dudas. También trabajamos rutinas de estudio para que el alumno vaya ganando autonomía y constancia." },
  { title: "Grupos reducidos y familias cerca", description: "Los grupos reducidos permiten prestar atención a cada estudiante. El personal cualificado en las distintas materias mantiene una comunicación directa y fluida con padres y madres." },
];

const levels = [
  { title: "Primaria", description: "Acompañamiento en las tareas, repaso de los contenidos de clase y ejercicios para afianzar las bases. Trabajamos los primeros hábitos de estudio." },
  { title: "Secundaria / ESO", description: "Refuerzo de las asignaturas del curso, resolución de dudas y preparación de exámenes. Ayudamos a organizar el trabajo y a mantener una rutina." },
  { title: "Bachillerato", description: "Apoyo en materias troncales y específicas, ajustado a los contenidos que el alumno está cursando y a la preparación de sus exámenes." },
  { title: "Inglés", description: "Refuerzo de los contenidos de inglés que se trabajan en el centro de estudios. Consulta el nivel y la disponibilidad con el departamento de clases." },
];

export function SupportProgram() {
  return <>
    <nav className="support-navigation" aria-label="Información sobre clases de apoyo"><a className="text-link" href="#metodologia">Metodología<Icon name="arrow" /></a><a className="text-link" href="#asignaturas">Asignaturas y niveles<Icon name="arrow" /></a></nav>
    <section className="section support-methodology" id="metodologia">
      <div className="section-heading"><h2>Metodología: entender,<br />practicar y avanzar.</h2><p>Clases de apoyo a medida. Acompañamos el trabajo del colegio o instituto, atendiendo a las necesidades del alumno y de su centro de estudios.</p></div>
      <div className="service-detail-grid">{methodology.map((item) => <article className="info-block" key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </section>
    <section className="section support-subjects" id="asignaturas">
      <div className="section-heading"><h2>Asignaturas y niveles</h2><p>Apoyo en todas las asignaturas, tanto troncales como específicas, de Primaria a Bachillerato. Cuéntanos el curso y la materia para confirmar la atención y el grupo disponibles.</p></div>
      <div className="support-levels">{levels.map((level) => <article key={level.title}><h3>{level.title}</h3><p>{level.description}</p></article>)}</div>
      <div className="support-enquiry"><p><strong>¿Qué necesita reforzar tu hijo o hija?</strong><br />Dinos el nivel, la asignatura y qué le está costando. Te orientamos sobre las clases y los horarios.</p><a className="button button-blue" href="tel:+34663232358">Consultar una plaza<Icon name="phone" /></a></div>
    </section>
  </>;
}
