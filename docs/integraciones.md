# Integraciones pendientes

Documento interno de alcance. Las funciones descritas como pendientes no estan implementadas ni comprometidas para una fecha de apertura.

## Esta entrega

- Una plantilla `src/app/[slug]/page.tsx` genera los slugs de `services`, `futureModules` y cinco paginas auxiliares: `descarga-tarjeta`, `plataforma-gps`, `politica-privacidad`, `aviso-legal` y `blog`.
- `generateStaticParams` genera todas esas paginas; `dynamicParams = false` rechaza los slugs no previstos. Tanto la pagina como `generateMetadata` esperan `params` y llaman a `notFound()` para un slug desconocido.
- Cada slug y contacto tienen titulo, descripcion y canonical propios. No sobrescriben `robots`: heredan el `noindex` de la preview definido en el layout. No retirar esa proteccion hasta aprobar contenido, legales y dominio. `noindex` no es control de acceso: los borradores siguen siendo accesibles a quien tenga la URL.
- Servicios reutiliza textos e imagenes locales. No se importan bloques HTML de WordPress, scripts ni formularios historicos. Se recupera exclusivamente el iframe de ubicacion Google Maps en un componente propio. No se publica una garantia de aprobado ni un plazo de 21 dias.
- Contacto contiene enlaces `tel:`, `mailto:` y WhatsApp; contacto y portada muestran el mapa incrustado y un enlace para abrir indicaciones. No hay backend de correo, formulario, confirmacion de envio, autenticacion, base de datos, pagos ni reservas simuladas.
- No se introducen dependencias adicionales al scaffold. La configuracion local incluye redirecciones de rutas historicas; no se ha cambiado el dominio ni el despliegue.

## Accesos existentes

| Servicio | Destino | Estado en esta web |
| --- | --- | --- |
| GPS | https://takcanarias.app-gps.es | Enlace directo desde `/plataforma-gps` y `/area-cliente` |
| Descarga de tarjeta | https://tachomat.app.vdo-fleet.com/connect/insert-card | URL actual facilitada por el usuario; acceso directo desde portada, menu, asesoria, descarga y area de cliente |
| WhatsApp de direccion | https://wa.me/34609365012 | Enlace desde contacto y ContactBand |
| Mapa | `site.mapEmbed` / `site.maps` | Iframe recuperado del inicio original y enlace para abrir indicaciones |

Los enlaces externos abren otra pestana con `rel="noopener noreferrer"`. Conservar las URLs proporcionadas en `site.ts`; no pedir, transmitir, comprobar ni reutilizar las credenciales de esos servicios. Un enlace disponible no acredita que una cuenta tenga permisos ni que el proveedor este operativo.

### Evidencia del GPS (revision del 12/09/2026)

El menu original de `http://www.takcanarias.es/` etiqueta el enlace como **AREA CLIENTES** y apunta a `https://takcanarias.app-gps.es`. Tambien existe `/plataforma-gps/`, pagina WordPress publicada ID 65, con un iframe hacia `https://takcanarias.app-gps.com`. El menu usa `.es` y el iframe `.com`: no se ha verificado que sean equivalentes. La nueva web conserva el destino `.es` del menu.

Coinciden la web HTTP en vivo y el archivo local (`_scrape/html/home.html`, enlaces en lineas 3799 y 3851; `_scrape/raw/pages.json`, ID65). La pagina GPS no estaba vacia: la primera extraccion de texto omitio el iframe. No se encontraron menciones de GPS ni solicitudes de incorporarlo en el chat ni en la transcripcion completa revisados; **su procedencia es la web anterior, no un requisito verbal atribuido a la clienta**. El usuario ha confirmado mantenerlo.

### VDO, clases y mapa

- Tachomat: HTTP 200 en la URL actual. El formulario del proveedor permite insertar tarjeta, descargar datos e imprimir recibo; no se ha probado una tarjeta real. La nueva web enlaza directamente a VDO, sin recrear ni incrustar su interfaz de lectura.
- Clases: metodologia desarrollada a partir de la pagina original ID323: apoyo personalizado, tareas diarias, ejercicios extra, preparacion de examenes, rutinas, personal cualificado, grupos reducidos y comunicacion familiar. La fuente afirma todas las asignaturas troncales y especificas de Primaria a Bachillerato; ingles se nombra en portada. No se inventa un listado de otras materias.
- Mapa: se reutiliza la URL Google Maps observada en el iframe del inicio original, con direccion calle Pintor Nicolas Massieu 6. El componente carga diferida (`loading="lazy"`) y reserva altura. El navegador conecta con Google al cargar el mapa; **lazy loading no sustituye consentimiento**. Revisar condiciones, tratamiento de datos y consentimiento aplicable antes del lanzamiento. La preview sigue con noindex y legales pendientes.

## DeCA

Peticion de la clienta: integrar el Documento Electronico de Control Administrativo para empresas en el entorno de Takcanarias. Existe un proyecto separado; `/deca` es una presentacion de la integracion pendiente, no una aplicacion documental activa.

Antes de elegir una arquitectura, revisar el proyecto existente con su responsable:

- Obtener repositorio, version desplegada, documentacion, propietario tecnico, entorno de pruebas y alcance funcional real. No incluir secretos ni datos de clientes en este documento.
- Confirmar si la primera integracion sera un enlace a la aplicacion, acceso federado o una API. Un enlace aprobado es la opcion mas simple; integrar sesiones/API solo si hay un contrato soportado y una necesidad confirmada. No duplicar autenticacion ni reconstruir el proyecto a ciegas.
- Validar los flujos requeridos: alta de empresa y usuarios, creacion, validacion, consulta y descarga de documentos, estados, rectificaciones, firma si procede y trazabilidad. No presuponer que todos existen ni inventar requisitos legales.
- Acordar el sistema que es fuente de verdad para empresas, usuarios, vehiculos, conductores y documentos; establecer identificadores y responsabilidades de sincronizacion, si se necesita.
- Revisar permisos por accion y aislamiento multiempresa del proyecto actual, incluidos documentos descargables, enlaces compartidos, exportaciones, registros de auditoria y administracion delegada.
- Confirmar responsabilidades sobre custodia, retencion, copias, recuperacion, soporte e incidencias. Validar requisitos normativos con la clienta y asesoramiento competente, sin presentar el prototipo como homologado.

## Cursos online

Peticion de la clienta: aula online vinculada al centro y seguimiento de asistencia. Grabaciones, clases en directo o modalidad mixta: TBD, pendiente de decision. No se elige LMS, proveedor de video ni sistema de videoconferencia en esta entrega.

- Inventariar cursos, destinatarios, docentes, programas, materiales, derechos de uso, requisitos de acceso y convocatorias.
- Confirmar modalidad por curso, especialmente CAP: no asumir que ver una grabacion satisface requisitos de presencia, asistencia u homologacion.
- Definir matriculacion y asignacion de cursos, duracion del acceso, seguimiento del aprendizaje, evaluaciones y certificados solo si son parte del alcance aprobado.
- Para grabaciones: almacenamiento, control de acceso, subtitulos, descargas permitidas y conservacion. Para directo: agenda, plataforma, participantes, asistencia y consentimiento si se graba.
- Separar progreso de contenidos de asistencia acreditada. Acordar quien registra, valida y corrige la asistencia, y que evidencia es necesaria.
- Revisar si el proyecto existente ya cubre identidades, empresas o formacion antes de crear un sistema paralelo. Confirmar accesibilidad y uso desde movil.

## Agenda y practicas

La clienta ha pedido reservas de clases/practicas, seguimiento de practicas y consulta de asistencia a cursos en el area privada. `/area-cliente` comunica ese alcance como futuro; actualmente remite al centro y conserva GPS y descarga externos.

- Definir disponibilidad de profesores, aulas y vehiculos, duracion de sesiones y zona horaria `Atlantic/Canary`, incluido cambio de hora.
- Acordar quien propone y confirma una reserva, antelacion, cancelaciones, reprogramaciones, ausencias, conflictos y bloqueos de agenda. Evitar doble reserva con validacion en el servidor cuando se implemente.
- Definir que puede ver el alumno de sus practicas: sesiones realizadas, objetivos, observaciones y proximos pasos. Separar anotaciones internas del profesor de informacion compartida con alumno o familia.
- Acordar registro y correccion de asistencia, responsables, historico de cambios, exportaciones y tratamiento de incidencias.
- Confirmar notificaciones y canales permitidos; no dar por contratados email transaccional, SMS, WhatsApp automatizado o pagos.
- Revisar gestion de menores y autorizacion de tutores cuando corresponda, sin asumir que cualquier familiar o empresa puede consultar datos del alumno.

## Roles y permisos

Matriz candidata para revisar con la clienta y con el proyecto existente, no modelo de permisos ya aprobado:

| Rol candidato | Alcance a validar |
| --- | --- |
| Alumno | Sus cursos, sus reservas, seguimiento visible y asistencia propia |
| Profesor | Alumnos y sesiones asignadas; registro de practicas/asistencia autorizado |
| Administracion del centro | Convocatorias, matriculas, agenda y correcciones dentro de sus competencias |
| Usuario de empresa | Documentos y servicios autorizados de su empresa, no de otras |
| Administrador de empresa | Gestion delegada de miembros y permisos, solo si se aprueba |
| Administrador de plataforma | Operaciones excepcionales justificadas y auditadas; sin acceso global implicito |

Revisar miembros de varias empresas, cambio de empresa activa, altas/bajas, revocacion de accesos, cuentas compartidas y alcance de asesores que gestionen varias empresas. La autorizacion debe comprobarse en servidor por recurso y accion, no solo ocultando controles. Probar expresamente que cambiar un ID o una URL no permite leer o modificar datos ajenos. Reutilizar el modelo existente solo tras comprobar que satisface ese aislamiento.

## Contenido y fuentes

Referencia principal para la nueva web: `src/content/site.ts`, sus arrays `services` y `futureModules`, y las imagenes locales indicadas alli. Fuentes historicas consultadas el 12 de septiembre de 2026 mediante HTTP publico, sin inicio de sesion:

- `http://www.takcanarias.es/`: direccion, horario, telefono fijo, asesoria, administracion y formacion.
- `http://www.takcanarias.es/clases-de-apoyo/`: departamento de clases `663 232 358`, asesoria `657 898 928`, fijo `828 024 990`, `clases@takcanarias.es` y `administracion@takcanarias.es`.
- `http://www.takcanarias.es/contacto/`: `direccion@takcanarias.es`, `609 365 012` y WhatsApp del mismo numero. No se inventan numeros de WhatsApp para otros departamentos.
- `http://www.takcanarias.es/wp-json/wp/v2/pages`: confirma el contenido vacio de la pagina blog (ID 20), ademas del contenido de contacto y servicios. Se consulta como referencia, nunca en el render ni durante el build.
- `http://www.takcanarias.es/wp-json/wp/v2/posts?per_page=100&_fields=id,link,title`: devuelve tres entradas historicas de descarga, con slugs `descarga-tarjeta`, `descarga-tarjetas-2` y `descarga-tarjetas` (IDs 296, 292 y 289). El blog nuevo no fabrica articulos: enlaza a `/descarga-tarjeta`, que conserva la utilidad de esas entradas. No se ha migrado su HTML.

`next.config.ts` conserva mediante redirecciones permanentes los dos slugs historicos plurales hacia `/descarga-tarjeta`, y las portadas duplicadas hacia `/`. El contenido publico original se conserva en `_scrape/` (excluido de Git). La pagina de ejemplo ajena al negocio responde 404 en la nueva web. Revisar el mapa de rutas antes del cambio de dominio.

La consulta HTTPS de la web historica fallo por un certificado cuyo nombre no coincide con `www.takcanarias.es`. No se desactivo TLS ni se probaron credenciales. El canonical de la nueva web conserva el HTTPS de `site.url`; el responsable del despliegue debe validar dominio, certificado y redirecciones antes de publicar. Los datos departamentales estan contrastados con la publicacion historica, no mediante llamadas ni mensajes de prueba.

## Legales y apertura

`/politica-privacidad` y `/aviso-legal` son borradores internos visibles y expresamente marcados, no textos de cumplimiento. No se copia la politica generica de WordPress sobre comentarios, Gravatar o cookies como si describiera el nuevo sistema.

- Solicitar razon social o identidad juridica, NIF, domicilio legal, datos registrales y autorizaciones profesionales aplicables.
- Inventariar los tratamientos reales: consultas, alumnos/menores, empresas, documentos, seguimiento y asistencia; validar finalidad, base juridica, conservacion, destinatarios, encargados, transferencias y ejercicio de derechos.
- Revisar alojamiento, registros tecnicos, correo, WhatsApp, GPS, descarga, futuros proveedores de cursos y cualquier analitica/cookie antes de redactar afirmaciones definitivas.
- Validar contenidos, imagenes, precios/condiciones si se publican, permisos de acceso y responsabilidades contractuales. No prometer aprobado ni resultados en 21 dias.
- Abrir funciones privadas solo tras pruebas de permisos y aislamiento, aprobacion de la clienta, soporte y procedimiento de recuperacion. Hasta entonces, mantener los estados de preparacion y los canales reales.

## Contrato CSS

No se anaden clases ajenas al contrato de las paginas: `container`, `breadcrumb`, `detail-hero`, `detail-copy`, `detail-media`, `section`, `section-heading`, `service-detail-grid`, `info-block`, `faq-list`, `future-hero`, `future-status`, `feature-list`, `access-panel`, `button`, `button-blue`, `button-outline` y `text-link`. `ContactBand` aporta sus propias clases compartidas.

- `detail-hero`: dos columnas en escritorio, una en movil. Las imagenes usan `fill`, `sizes="(max-width: 800px) 100vw, 50vw"` y `object-fit: cover`; alinear el breakpoint CSS con esos 800 px.
- `detail-media`: requiere `position: relative` y altura o `aspect-ratio` no nulos, tambien en movil. Las imagenes proceden de `public/images`.
- `section-heading`: contiene `h2` y `p`. `info-block`: `h3` y parrafos; contacto incluye tambien `address` y enlaces largos de correo que deben poder partirse.
- `faq-list`: contiene elementos `details` con `summary` y `p`. Mantener foco visible y un indicador de apertura reconocible; no requiere JavaScript.
- `feature-list`: lista `ul > li`, cada fila con `Icon` y texto; todas las funciones se etiquetan como previstas.
- `access-panel`: contiene icono, `h3`, descripcion, enlace con aspecto de boton y aviso de apertura externa.
- `future-hero`: cabecera de una columna para futuro, utilidades, blog, legales y 404. `future-status` es texto estatico, no un indicador de servicio en tiempo real.

Verificar overflow, contraste, foco, FAQ y dimension de imagen en escritorio y movil cuando se integre el CSS del padre.
