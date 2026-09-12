# Verificación de la primera versión

12 de septiembre de 2026. Servidor local de producción, Next 16.3.5.

## Ejecuciones

- `pnpm lint`: correcto.
- `pnpm build`: correcto, incluida comprobación TypeScript y generación estática.
- `pnpm test:smoke`: 14 páginas con 200, títulos únicos, un H1, canonical e idioma
  español; 13 destinos internos con 200; 4 rutas con 404; 5 redirecciones 308 de
  rutas históricas y una 307 del favicon; robots y sitemap de 8 URLs correctos.
- `git check-ignore`: chat, reunión, `_scrape/` y `node_modules/` fuera de Git.
  No se han hecho commits ni envíos al remoto.

## Navegador

Agent Browser 0.27.0, sesiones aisladas `tak-qa` y `tak-review`, sin interacción
con cuentas reales ni envío de consultas. Se utilizó un navegador separado al
fallar Chrome DevTools por conflicto con su perfil ya abierto.

Matriz: 14 rutas de README × anchuras 320, 375, 414, 768 y 1440, altura 900 px:
**70 combinaciones**, repetidas tras corregir los defectos detectados.

- Sin scroll horizontal, elementos visibles fuera del viewport ni contenido
  sobresaliendo del rectángulo de los enlaces en la pasada final.
- 185 comprobaciones de carga de imagen (contando repeticiones entre tamaños): correctas.
- Un H1 por página, primer encabezado visible H1 y sin saltos ascendentes de nivel.
- Sin excepciones JavaScript ni mensajes de consola registrados en esas sesiones.
- Menú escritorio: Enter/Espacio, Tab, Escape y retorno del foco.
- Menú móvil a cuatro anchuras: apertura, enlace interno, cierre tras navegación,
  cierre por botón y Escape con retorno del foco.
- 9 FAQ × 5 anchuras, abrir/cerrar con Enter/Espacio: 45 casos y 180 transiciones.
- Portada a 1280×800, 1920×1080 y 320×800: CTA principal y enlace secundario
  visibles sin scroll y sin elementos superpuestos en su centro.
- Movimiento reducido emulado: transiciones a cero, sin animación y scroll automático.

## Defectos corregidos

1. Dos encabezados perdían espacios al ocultar sus saltos de línea en móvil.
   Se añadieron espacios al contenido y se comprobaron renderizados.
2. Las flechas sobresalían 2 px de sus enlaces. Ajustadas al ancho de su columna;
   `scrollWidth - clientWidth = 0` en la pasada final.
3. Foco rojo insuficiente sobre azul oscuro (2,74:1). Sustituido por foco blanco
   sólido de 3 px en las franjas oscuras, comprobado en estilos computados.
4. La leyenda pequeña de la fotografía hero lleva fondo azul opaco: el contraste
   no depende de la fotografía.

## Contraste de tokens

Conversión OKLCH a sRGB mediante canvas del navegador y fórmula WCAG de luminancia
relativa; no estimado solamente por luminosidad OKLCH.

| Combinación | Ratio |
| --- | --- |
| Tinta sobre papel | 14,54:1 |
| Texto secundario sobre papel | 6,19:1 |
| Texto secundario sobre superficie azul clara | 5,50:1 |
| Blanco sobre botón azul | 10,03:1 |
| Azul claro sobre fondo marino | 9,11:1 |
| Foco rojo sobre papel | 5,32:1 |

No equivale a un barrido exhaustivo de todos los colores sobre imágenes ni a una
certificación WCAG. Sin auditoría de lector de pantalla, dispositivos físicos ni
medición de Core Web Vitals en producción.

## Límites

- Preview con `noindex, follow` deliberadamente.
- Legales pendientes de identificación y validación.
- Datos comerciales contrastados con la publicación histórica, no por llamada
  de confirmación ni consulta al registro oficial de homologaciones.
- No se validaron credenciales ni operatividad de los proveedores GPS/tarjetas.
- Sin backend de formularios, pagos, matrícula, login ni reservas.
- DeCA, cursos, prácticas y asistencia son integración pendiente, no funciones
  verificadas aquí. No se inspeccionó el proyecto DeCA en esta entrega.
- Fotografías y logo recuperados: derechos pendientes de confirmación.

Capturas y JSON en el temporal aprobado de OpenCode con prefijos `tak-qa-` y `tak-`;
no se incorporan a producción.

## Revisión solicitada: VDO, apoyo y mapa

Segunda revisión del 12/09/2026:

- Acceso actualizado a `https://tachomat.app.vdo-fleet.com/connect/insert-card`.
  Comprobado HTTP 200, href exacto y apertura externa segura en los botones de
  portada, asesoría, descarga de tarjeta, menú y área de cliente. No se prueba
  una tarjeta física ni se simula una descarga.
- Bloque propio de gestión de tacógrafos en portada y enlace principal en menú.
- Clases de apoyo: metodología, asignaturas/niveles y preguntas ampliadas según
  la fuente histórica. Ambos accesos por ancla comprobados con ratón; el de
  asignaturas también con foco y Enter. No se crean materias no documentadas.
- Mapa Google recuperado de la URL del iframe original. Comprobado visualmente
  cargado en portada y contacto, con pin y dirección Pintor Nicolás Massieu 6;
  también visible a 375 px. No es solo un contenedor vacío.
- GPS: origen documentado en `docs/integraciones.md`. Menú antiguo «ÁREA CLIENTES»
  hacia `.app-gps.es`; iframe de página GPS hacia `.app-gps.com`. No se afirma
  equivalencia ni que la clienta lo solicitase en la reunión.

Pruebas nuevas: 6 rutas afectadas × 320/375/768/1024/1440 = **30 combinaciones**;
sin scroll horizontal, elementos fuera del viewport ni etiquetas de botones
desbordadas. Un H1 por página, botones VDO visibles con destino correcto y mapa
presente en las dos rutas. Cabecera adicional a 961, 1120 y 1280 px.

Se detectó y corrigió una colisión de la clase `container` con el `max-width`
responsive de Tailwind: el menú salía de su contenedor a 961 px, aunque no
desbordaba la pantalla. Tras explicitar `max-width: none`, la pasada final de las
30 combinaciones y las tres cabeceras no devolvió fallos.

Menú desktop: apertura por teclado y Escape. Menú móvil: apertura, navegación
a asesoría y cierre automático correctos. Build/lint y smoke test ampliado con
URL VDO, iframe con título y secciones de apoyo correctos.

El mapa realiza peticiones a Google al cargar. No confundir `loading="lazy"`
con consentimiento; este aspecto queda documentado en el borrador de privacidad
y pendiente de validación antes de publicar.
