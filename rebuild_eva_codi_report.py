from pathlib import Path

from docx import Document
from docx.enum.text import WD_BREAK
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


DESKTOP = Path(r'C:\Users\marce\Desktop\codi')
ARCHITECTURE = Path(r'C:\Users\marce\Documents\Codi\architecture')
SOURCE = DESKTOP / 'EVA-3117_base_recuperado.docx'
OUTPUT = DESKTOP / 'Informe_Evaluador_Automatico_EVA-3117_y_Codi.docx'

INDEX_ENTRIES = [
    ('Resumen', 3),
    ('1. Introducción', 3),
    ('1. Antecedentes', 3),
    ('2. Marco Teórico', 3),
    ('3. Razones que motivaron el trabajo', 4),
    ('4. Situación Problemática', 4),
    ('5. Objetivos', 4),
    ('5.2. Objetivo General', 4),
    ('5.2. Objetivos específicos', 4),
    ('6. Hipótesis', 5),
    ('7. Análisis de Costos', 5),
    ('2. Temática de la Aplicación', 6),
    ('1. Descripción General del Sistema', 6),
    ('2. Interfaz del estudiante', 6),
    ('3. Interfaz del docente', 11),
    ('4. Modo de uso', 12),
    ('5. Descripción técnica', 13),
    ('5.1. Hardware del Servidor', 13),
    ('5.2. Infraestructura de red', 13),
    ('5.3. Software y sistema operativo', 13),
    ('5.4. Programación y arquitectura del evaluador', 13),
    ('3. Desarrollo', 14),
    ('1. Roles del Equipo', 14),
    ('2. Actividades Desarrolladas', 15),
    ('3. Planificación y ejecución del proyecto', 15),
    ('4. Recolección y elaboración de datos', 15),
    ('4. Resultados Obtenidos', 16),
    ('1. Beneficios', 16),
    ('5.1. Para los alumnos', 16),
    ('5.2. Para los docentes', 16),
    ('5.3. Para la institución', 16),
    ('2. Limitaciones', 17),
    ('3. Conclusión', 17),
    ('Referencias', 17),
]


def clear_report_body(document: Document) -> None:
    body = document.element.body
    start = next(paragraph._p for paragraph in document.paragraphs if paragraph.text == 'Resumen')
    remove = False
    for child in list(body):
        if child is start:
            remove = True
        if remove and child.tag != qn('w:sectPr'):
            body.remove(child)


def replace_index(document: Document) -> None:
    body = document.element.body
    index_title = next(paragraph for paragraph in document.paragraphs if paragraph.text == 'Índice')
    summary = next(paragraph for paragraph in document.paragraphs if paragraph.text == 'Resumen')
    children = list(body)
    index_position = children.index(index_title._p)
    summary_position = children.index(summary._p)

    for child in children[index_position + 1 : summary_position]:
        body.remove(child)

    index_title.text = 'Índice'
    after = index_title._p
    for title, page in INDEX_ENTRIES:
        paragraph = document.add_paragraph()
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.add_run(title)
        paragraph.add_run('\t')
        paragraph.add_run(str(page))
        after.addnext(paragraph._p)
        after = paragraph._p


def add_text(document: Document, text: str, bold_prefix: str | None = None) -> None:
    paragraph = document.add_paragraph()
    if bold_prefix and text.startswith(bold_prefix):
        paragraph.add_run(bold_prefix).bold = True
        paragraph.add_run(text[len(bold_prefix) :])
    else:
        paragraph.add_run(text)


def add_bullet(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.left_indent = Inches(0.28)
    paragraph.paragraph_format.first_line_indent = Inches(-0.18)
    paragraph.add_run('• ' + text)


def add_caption(document: Document, text: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(text)
    run.italic = True
    run.font.size = Pt(9)


def add_figure(document: Document, file_name: str, caption: str, width: float = 6.15) -> None:
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.add_run().add_picture(str(ARCHITECTURE / file_name), width=Inches(width))
    add_caption(document, caption)


def add_table(document: Document, headers: list[str], rows: list[list[str]], style) -> None:
    table = document.add_table(rows=1, cols=len(headers))
    table.style = style
    for cell, value in zip(table.rows[0].cells, headers):
        cell.text = value
    for row in rows:
        cells = table.add_row().cells
        for cell, value in zip(cells, row):
            cell.text = value


def update_cover(document: Document) -> None:
    for paragraph in document.paragraphs:
        if paragraph.text == 'Evaluador Automático 3117':
            paragraph.text = 'Evaluador Automático EVA 3117 y Codi'
        if paragraph.text == 'Servidor Evaluador de Códigos':
            paragraph.text = 'Sistema integrado de enseñanza y evaluación de programación'


def build_report(document: Document, table_style) -> None:
    document.add_page_break()
    document.add_heading('Resumen', level=1)
    add_text(
        document,
        'Evaluador Automático EVA 3117 y Codi es un sistema educativo integrado para la Escuela de '
        'Educación Técnica N.° 3117 Maestro Daniel Óscar Reyes. Codi organiza la enseñanza de programación '
        'mediante islas, módulos, lecciones, práctica guiada y laboratorio. EVA 3117 recibe las soluciones '
        'enviadas por los estudiantes, las ejecuta en un entorno aislado y devuelve un veredicto objetivo. '
        'La propuesta transforma la corrección manual y tardía en un ciclo interactivo de aprender, programar, '
        'enviar, recibir retroalimentación y volver a intentar, con información útil tanto para el alumno como '
        'para el docente.'
    )

    document.add_heading('1. Introducción', level=1)
    add_text(
        document,
        'La enseñanza de programación requiere que los estudiantes puedan comprender conceptos, practicar '
        'con ejercicios y recibir devoluciones precisas. Cuando estos procesos se encuentran en herramientas '
        'separadas, el alumno pierde continuidad y el docente debe invertir tiempo extra en distribuir material, '
        'revisar entregas y registrar resultados. El proyecto integra dos desarrollos complementarios para '
        'resolver ese problema: Codi enseña y EVA 3117 evalúa.'
    )
    add_text(
        document,
        'Codi brinda la experiencia de aprendizaje: presenta recorridos visuales, contenido progresivo, '
        'lecciones, actividades y un laboratorio de código. EVA 3117 brinda la evaluación automática: procesa '
        'el envío, ejecuta los casos de prueba dentro de un sandbox y comunica el resultado a Codi. Así, el '
        'estudiante puede aprender, practicar, corregir y demostrar su progreso dentro del mismo sistema; el '
        'docente puede proponer desafíos, observar los resultados y dedicar más tiempo a orientar que a repetir '
        'correcciones de código.'
    )

    document.add_heading('1. Antecedentes', level=2)
    add_text(
        document,
        'El proyecto EVA 3117 surgió de la necesidad de contar con corrección automática de programas y de '
        'acercar a los estudiantes a experiencias similares a las competencias informáticas. Durante su desarrollo '
        'se comprobó que una evaluación técnica confiable es valiosa, pero que también era necesario ordenar la '
        'enseñanza previa y acompañar el proceso de práctica. Codi nace como respuesta a esa necesidad pedagógica.'
    )
    add_text(
        document,
        'La integración actual supera el modelo de una herramienta aislada de corrección. En lugar de presentar '
        'un ejercicio sin contexto, Codi prepara al estudiante con lecciones y una ruta progresiva; cuando la '
        'actividad requiere validación, EVA 3117 evalúa la solución con criterios definidos por el docente.'
    )

    document.add_heading('2. Marco Teórico', level=2)
    add_text(
        document,
        'Un sistema de aprendizaje de programación debe combinar contenido, práctica deliberada y '
        'retroalimentación. La retroalimentación inmediata permite detectar errores de razonamiento, probar '
        'nuevas estrategias y construir autonomía. A su vez, la evaluación automática ejecuta el mismo conjunto '
        'de pruebas para todos los estudiantes, por lo que sostiene criterios consistentes y verificables.'
    )
    add_text(
        document,
        'La ejecución de código enviado por usuarios requiere aislamiento. El sandbox limita los recursos y '
        'separa el proceso de evaluación de los servicios que contienen información institucional. Esta decisión '
        'permite utilizar ejercicios de Python, C++ y Java sin exponer la aplicación educativa, la base de datos '
        'ni los demás envíos de los estudiantes.'
    )

    document.add_heading('3. Razones que motivaron el trabajo', level=2)
    for item in [
        'Unificar la explicación, la práctica y la evaluación de programación en una misma experiencia.',
        'Reducir el tiempo que los docentes dedican a corregir manualmente ejercicios repetitivos.',
        'Ofrecer una ruta de aprendizaje clara para estudiantes con distintos niveles de experiencia.',
        'Brindar devoluciones técnicas inmediatas y objetivas sobre cada solución enviada.',
        'Convertir cada error de programación en una oportunidad concreta para revisar, corregir y volver a intentar.',
        'Utilizar una arquitectura actualizable desde servicios centralizados, sin configurar programas en cada equipo.',
        'Preparar a los estudiantes para entornos académicos, técnicos y de competencia donde se utilizan jueces automáticos.',
    ]:
        add_bullet(document, item)

    document.add_heading('4. Situación Problemática', level=2)
    add_text(
        document,
        'En la institución, el aprendizaje de programación suele depender de materiales dispersos, prácticas '
        'sin una secuencia común y correcciones manuales. Esto provoca que los estudiantes reciban devoluciones '
        'tarde, que el docente tenga menos tiempo para acompañar casos particulares y que sea difícil observar '
        'el progreso de cada alumno. Cuando la única devolución llega después de revisar el código de forma manual, '
        'el estudiante no puede relacionar con rapidez su decisión de programación con el resultado obtenido. '
        'También puede generar diferencias entre las herramientas disponibles en cada equipo y una separación '
        'artificial entre aprender a programar y demostrar que una solución funciona.'
    )
    add_text(
        document,
        'La problemática central es la falta de un sistema único que acompañe el aprendizaje y evalúe el código '
        'de manera confiable. Codi y EVA 3117 responden a esta necesidad mediante un recorrido pedagógico '
        'con contenido actualizado y una evaluación aislada que entrega resultados consistentes.'
    )

    document.add_heading('5. Objetivos', level=2)
    document.add_heading('5.2. Objetivo General', level=2)
    add_text(
        document,
        'Implementar un sistema integrado de enseñanza y evaluación de programación para la E.E.T. N.° 3117, '
        'en el que Codi guíe el aprendizaje mediante contenidos y laboratorios, y EVA 3117 evalúe las soluciones '
        'de código de forma automática, segura y objetiva.'
    )
    document.add_heading('5.2. Objetivos específicos', level=2)
    for item in [
        'Organizar contenidos de programación en islas, módulos, submódulos y lecciones progresivas.',
        'Permitir que los estudiantes practiquen código dentro de un laboratorio integrado a cada actividad.',
        'Evaluar soluciones en Python, C++ y Java con casos de prueba definidos por el docente.',
        'Ofrecer al estudiante un ciclo de envío, veredicto, análisis del error y nuevo intento dentro de la actividad.',
        'Aislar la ejecución de código mediante una cola de evaluación y un sandbox sin acceso a los datos internos.',
        'Registrar progreso, intentos, resultados y retroalimentación para estudiantes y docentes.',
        'Facilitar que el docente detecte dificultades recurrentes y acompañe a cada estudiante con información concreta.',
        'Mantener una plataforma web actualizable y accesible desde navegadores autorizados.',
        'Favorecer la autonomía, el pensamiento lógico y la resolución de problemas.',
    ]:
        add_bullet(document, item)

    document.add_heading('6. Hipótesis', level=2)
    add_text(
        document,
        'Si la institución incorpora un sistema donde Codi enseña de manera progresiva y EVA 3117 evalúa '
        'automáticamente las soluciones, entonces mejorará la continuidad del aprendizaje, se reducirá el '
        'tiempo de corrección docente y los estudiantes recibirán devoluciones más rápidas, consistentes y útiles '
        'para mejorar sus programas.'
    )

    document.add_heading('7. Análisis de Costos', level=2)
    add_text(
        document, 'La propuesta prioriza herramientas de código abierto y servicios reutilizables de la institución.')
    add_table(
        document,
        ['Componente', 'Uso dentro del sistema', 'Costo estimado'],
        [
            ['Desarrollo Codi + EVA', 'Código fuente del equipo y herramientas abiertas.', '$0'],
            ['Infraestructura institucional', 'Equipos cliente, conectividad y acceso desde navegador.', 'Recurso existente'],
            ['Base de datos y caché', 'Persistencia de usuarios, contenidos, progreso y resultados.', 'Según despliegue'],
            ['Almacenamiento de recursos', 'Materiales de lecciones y archivos vinculados a actividades.', 'Según uso'],
            ['Mantenimiento', 'Actualizaciones de contenido, seguridad y mejoras funcionales.', 'Planificable por etapas'],
        ],
        table_style,
    )
    add_text(
        document,
        'El costo principal no se concentra en licencias por computadora, sino en el mantenimiento responsable '
        'del servicio: actualización de contenidos, control de acceso, resguardo de datos y mejoras del evaluador. '
        'El diseño web permite que las actualizaciones lleguen al sistema sin reinstalar software en cada equipo.'
    )

    document.add_heading('8. Alcance', level=2)
    add_text(
        document,
        'El sistema está dirigido a estudiantes y docentes de la especialidad Informática. En su primera etapa '
        'incluye rutas de aprendizaje de programación, lecciones, laboratorio de código, evaluación automática '
        'de actividades, historial de envíos, seguimiento de progreso y administración docente de los contenidos. '
        'El acceso se realiza a través de navegadores autorizados y cuentas institucionales.'
    )
    add_text(
        document,
        'Quedan fuera del alcance inicial la publicación abierta de datos estudiantiles, el acceso sin autenticación '
        'y la ejecución de código fuera del entorno aislado. Estas restricciones resguardan la privacidad, la '
        'seguridad y el uso pedagógico de la plataforma.'
    )

    document.add_heading('2. Temática de la Aplicación', level=1)
    document.add_heading('1. Descripción General del Sistema', level=2)
    add_text(
        document,
        'Evaluador Automático EVA 3117 y Codi es una plataforma web compuesta por dos capas conectadas. '
        'La primera, Codi, es la experiencia educativa que presenta los contenidos, organiza los recorridos y '
        'ofrece práctica. La segunda, EVA 3117, es el servicio de evaluación que recibe una solución, la procesa '
        'de forma aislada y comunica el resultado. Ambas capas comparten usuarios, actividades y progreso, '
        'pero cada una conserva una responsabilidad clara: Codi guía al alumno y EVA 3117 comprueba de manera '
        'consistente si su programa resuelve el desafío propuesto.'
    )
    add_figure(document, 'images/login.png', 'Figura 1. Acceso institucional a la plataforma Codi.')

    document.add_heading('2. Interfaz del estudiante', level=2)
    add_text(
        document,
        'La interfaz del estudiante muestra un mapa de islas de aprendizaje y rutas de módulos. Cada isla representa '
        'un área formativa y cada módulo contiene lecciones y actividades ordenadas. El estudiante visualiza su '
        'progreso, accede a contenidos y elige las actividades habilitadas según su recorrido.'
    )
    add_figure(document, 'images/dashboard.png', 'Figura 2. Islas de aprendizaje y acceso a las áreas de práctica.')
    add_figure(document, 'images/modulos.png', 'Figura 3. Recorrido progresivo de módulos de Programación Competitiva.')
    add_text(
        document,
        'Las lecciones combinan explicación, recursos visuales y objetivos de aprendizaje. El laboratorio permite '
        'leer el enunciado, escribir código, ejecutar pruebas y solicitar la evaluación correspondiente sin abandonar '
        'el contexto de la actividad. Este recorrido vuelve la programación más interactiva: el alumno prueba una '
        'idea, observa qué sucede, modifica su solución y vuelve a intentar con un objetivo visible.'
    )
    add_figure(document, 'images/leccion.png', 'Figura 4. Lección con contenido teórico y recursos visuales.')
    add_figure(document, 'images/laboratorio.png', 'Figura 5. Laboratorio integrado: enunciado, editor, ejecución y evaluación.')
    add_text(
        document,
        'Cuando el alumno considera que su solución está lista, EVA 3117 recibe el envío y lo evalúa con los casos '
        'de prueba configurados para el problema. El resultado no depende de una revisión manual posterior: el '
        'sistema informa el puntaje, conserva los intentos y permite que el estudiante compare el resultado de '
        'cada envío con su solución anterior.'
    )
    add_figure(document, 'images/eva-original/image3.png', 'Figura 6. EVA 3117: envío de una solución, puntaje e historial de intentos.')
    add_text(
        document,
        'La devolución de EVA 3117 hace visible el motivo del resultado: compilación correcta o fallida, salida '
        'correcta o errónea, límite de tiempo, memoria u otros estados de ejecución. Esta información permite que '
        'el error se convierta en una instancia de aprendizaje y no solo en una nota final.'
    )
    add_figure(document, 'images/eva-original/image2.png', 'Figura 7. EVA 3117: documentación de los veredictos de compilación y evaluación.')
    add_text(
        document,
        'El sistema también habilita consultas sobre la actividad. De este modo, la devolución automática resuelve '
        'los casos repetitivos y el docente puede concentrar su intervención en explicar estrategias, orientar '
        'razonamientos y responder dudas que requieren acompañamiento pedagógico.'
    )
    add_figure(document, 'images/eva-original/image4.png', 'Figura 8. EVA 3117: espacio de comunicación entre estudiante y docente.')

    document.add_heading('3. Interfaz del docente', level=2)
    add_text(
        document,
        'La administración docente permite crear y ordenar islas, módulos, submódulos y lecciones. Así, los '
        'contenidos pueden actualizarse según los objetivos de cada curso. El docente también define las '
        'actividades evaluables, configura los lenguajes y casos de prueba de EVA 3117, y consulta los resultados '
        'para acompañar el proceso de cada estudiante. En vez de invertir la mayor parte de la clase en revisar '
        'la misma consigna, puede identificar quién necesita apoyo y sobre qué tema.'
    )
    add_figure(document, 'images/administracion_islas.png', 'Figura 9. Codi: administración de islas, recorridos y disponibilidad.')
    add_figure(document, 'images/administracion_modulos.png', 'Figura 10. Codi: administración de módulos, submódulos y lecciones.')
    add_figure(document, 'images/eva-original/image6.png', 'Figura 11. EVA 3117: configuración docente de lenguajes, envíos y consultas.')

    document.add_heading('4. Modo de uso', level=2)
    for index, step in enumerate([
        'El docente crea o actualiza un recorrido de aprendizaje y define las actividades de cada módulo.',
        'El estudiante inicia sesión, consulta las lecciones y practica en el laboratorio de Codi.',
        'Cuando una actividad requiere evaluación, el estudiante envía su solución desde el laboratorio.',
        'La API registra el envío y lo entrega a la cola de evaluación de EVA 3117.',
        'El worker de EVA 3117 ejecuta el código dentro de un sandbox con casos de prueba y límites de recursos.',
        'Codi recibe el veredicto, lo muestra al estudiante y actualiza el historial de progreso.',
        'El estudiante interpreta la devolución, mejora la solución y puede volver a enviarla.',
        'El docente consulta resultados y ajusta el contenido o el acompañamiento según las necesidades observadas.',
    ], start=1):
        add_text(document, f'{index}. {step}')

    document.add_heading('5. Descripción técnica', level=2)
    document.add_heading('5.1. Hardware del Servidor', level=2)
    add_text(
        document,
        'La plataforma se consume desde navegadores y no requiere instalar compiladores ni clientes específicos '
        'en cada equipo. La infraestructura que ejecuta la API, la persistencia y la evaluación puede escalarse '
        'según la cantidad de usuarios y el volumen de envíos. Esto permite actualizar los servicios de manera '
        'centralizada y mantener una experiencia uniforme para los cursos.'
    )

    document.add_heading('5.2. Infraestructura de red', level=2)
    add_text(
        document,
        'El sistema se comunica mediante servicios web autenticados. La aplicación no depende de direcciones '
        'fijas visibles para el estudiante: el acceso se realiza a través del sitio institucional configurado para la '
        'plataforma. La autenticación, las autorizaciones y las comunicaciones entre Codi, la API y EVA 3117 '
        'se controlan de forma centralizada, facilitando actualizaciones y reduciendo configuraciones manuales.'
    )

    document.add_heading('5.3.Software y sistema operativo', level=2)
    add_table(
        document,
        ['Componente', 'Responsabilidad'],
        [
            ['Codi', 'Interfaz web de aprendizaje, contenidos, progreso y administración pedagógica.'],
            ['Next.js + React', 'Presentación web actualizable para estudiantes y docentes.'],
            ['NestJS', 'API, autenticación, reglas de negocio y comunicación con la evaluación.'],
            ['PostgreSQL + Prisma', 'Datos de usuarios, cursos, contenidos, progreso y envíos.'],
            ['Redis', 'Caché de información de acceso frecuente.'],
            ['Almacenamiento compatible con S3', 'Recursos cargados y lecturas firmadas.'],
            ['EVA 3117', 'Cola, worker y sandbox para evaluar código sin comprometer la plataforma.'],
        ],
        table_style,
    )
    add_text(
        document,
        'Las actualizaciones de la aplicación, los contenidos y los servicios se gestionan de manera '
        'centralizada. Este enfoque evita que cada aula o equipo deba mantener una versión diferente y facilita '
        'correcciones, mejoras de seguridad y publicación de nuevas actividades.'
    )

    document.add_heading('5.4.Programación y arquitectura del evaluador', level=2)
    add_text(
        document,
        'La arquitectura separa el plano de enseñanza del plano de ejecución de código. Codi y la API manejan '
        'usuarios, contenidos y resultados; EVA 3117 toma los envíos pendientes y los ejecuta en un sandbox '
        'aislado. La cola desacopla la interfaz de la carga de evaluación y permite procesar varios envíos sin '
        'bloquear la experiencia de aprendizaje. Esta separación hace posible que la interacción sea inmediata '
        'para el alumno sin exponer la plataforma educativa ni trasladar al docente la tarea repetitiva de ejecutar '
        'y comparar cada programa a mano.'
    )
    add_figure(
        document,
        'codi-runtime-architecture.visual-check.2048x1320.dark.png',
        'Figura 12. Arquitectura integrada: Codi enseña y EVA 3117 evalúa en un entorno aislado.',
    )
    for item in [
        'La API valida la identidad del usuario y los permisos antes de aceptar una solicitud.',
        'El envío se registra y se entrega a una cola de evaluación con la información mínima necesaria.',
        'El worker crea una sesión aislada, compila o interpreta el código y ejecuta los casos de prueba.',
        'Los límites de tiempo y memoria reducen el impacto de errores o ejecuciones no confiables.',
        'El resultado se conserva como evidencia de progreso y se muestra dentro de Codi.',
        'El sandbox no obtiene acceso a los datos internos de la plataforma ni a Internet.',
    ]:
        add_bullet(document, item)

    document.add_heading('3. Desarrollo', level=1)
    document.add_heading('1. Roles del Equipo', level=2)
    add_text(
        document,
        'El equipo distribuyó las tareas de infraestructura, desarrollo, documentación y validación funcional. '
        'La construcción de Codi y EVA 3117 requirió coordinación entre la definición pedagógica, el diseño de '
        'la interfaz, la integración de servicios, la seguridad de la evaluación y la preparación de evidencias.'
    )
    add_table(
        document,
        ['Integrante', 'Aporte principal'],
        [
            ['Gutierrez Fernando', 'Seguimiento del proyecto, pruebas de uso y organización de la evidencia.'],
            ['Luna Luciano', 'Arquitectura, integración de servicios y validación del laboratorio y la evaluación.'],
            ['Maitena Padilla', 'Documentación técnica, presentación del proyecto y pruebas pedagógicas.'],
            ['Santiago Alberti', 'Diseño de la experiencia Codi, investigación y pruebas de interfaz.'],
            ['Enzo Guzman', 'Apoyo en infraestructura, configuración y validación técnica.'],
        ],
        table_style,
    )

    document.add_heading('2. Actividades Desarrolladas', level=2)
    for item in [
        'Relevamiento de la problemática de enseñanza y corrección de programación.',
        'Diseño de Codi como experiencia de aprendizaje por islas, módulos y lecciones.',
        'Construcción del laboratorio de código y flujo de envío de soluciones.',
        'Integración de EVA 3117 mediante cola, worker y sandbox aislado.',
        'Implementación de usuarios, progreso, ranking, administración y recursos de contenido.',
        'Pruebas de navegación, envío, evaluación, seguridad y visualización de resultados.',
        'Elaboración del informe, la arquitectura y las capturas de demostración.',
    ]:
        add_bullet(document, item)

    document.add_heading('3. Planificación y ejecución del proyecto', level=2)
    add_table(
        document,
        ['Etapa', 'Actividad', 'Resultado'],
        [
            ['1', 'Análisis de necesidades', 'Problema, usuarios y objetivos definidos.'],
            ['2', 'Diseño de Codi', 'Recorridos, módulos, lecciones y laboratorio.'],
            ['3', 'Desarrollo de EVA 3117', 'Flujo de evaluación y aislamiento de código.'],
            ['4', 'Integración de servicios', 'Comunicación entre Codi, API, datos y evaluador.'],
            ['5', 'Pruebas y ajustes', 'Validación de interfaz, envíos y resultados.'],
            ['6', 'Documentación', 'Informe, arquitectura y evidencia visual.'],
        ],
        table_style,
    )

    document.add_heading('4. Recolección y elaboración de datos', level=2)
    for item in [
        'Registro de recorridos, lecciones, módulos y actividades disponibles en Codi.',
        'Resultados de envíos, veredictos y tiempos de evaluación producidos por EVA 3117.',
        'Capturas de la interfaz del estudiante, administración docente y arquitectura técnica.',
        'Observaciones de uso para mejorar contenido, navegación y seguimiento del progreso.',
        'Documentación de los servicios, los límites de seguridad y las decisiones de diseño.',
    ]:
        add_bullet(document, item)

    document.add_heading('4. Resultados Obtenidos', level=1)
    add_text(
        document,
        'El resultado principal es un prototipo funcional que integra enseñanza y evaluación. Codi permite '
        'estructurar el aprendizaje y EVA 3117 convierte las actividades de programación en evidencias '
        'objetivas de desempeño. La plataforma muestra que ambas funciones pueden convivir sin sacrificar '
        'la claridad pedagógica ni la seguridad de la ejecución de código. El alumno recibe una respuesta '
        'cercana al momento en que programa y el docente dispone de resultados para intervenir donde su '
        'acompañamiento aporta mayor valor.'
    )
    document.add_heading('1. Beneficios', level=2)
    document.add_heading('5.1. Para los alumnos', level=2)
    for item in [
        'Recorrido claro desde los contenidos iniciales hasta los desafíos de programación.',
        'Práctica contextualizada en un laboratorio integrado a cada actividad.',
        'Devolución inmediata sobre soluciones correctas, errores de compilación o resultados incorrectos.',
        'Posibilidad de corregir y volver a enviar una solución mientras el razonamiento todavía está presente.',
        'Historial y progreso visibles para identificar avances y temas a reforzar.',
        'Mayor autonomía para experimentar, corregir y volver a intentar sin depender de esperar una corrección manual.',
    ]:
        add_bullet(document, item)
    document.add_heading('5.2. Para los docentes', level=2)
    for item in [
        'Administración centralizada de recorridos, módulos, lecciones y actividades.',
        'Menor carga de corrección repetitiva y mayor disponibilidad para acompañamiento personalizado.',
        'Resultados consistentes basados en los mismos casos de prueba para todos los estudiantes.',
        'Información de progreso e intentos para detectar errores recurrentes, planificar refuerzos y nuevas actividades.',
        'Canal de consulta para complementar los veredictos automáticos con explicación y orientación docente.',
    ]:
        add_bullet(document, item)
    document.add_heading('5.3. Para la institución', level=2)
    for item in [
        'Sistema propio de enseñanza y evaluación alineado con la especialidad Informática.',
        'Actualización centralizada de contenidos, actividades evaluables y servicios sin instalaciones por equipo.',
        'Arquitectura escalable que separa datos, aplicación y ejecución de código.',
        'Evidencia de progreso y resultados que facilita el seguimiento de las prácticas de programación.',
    ]:
        add_bullet(document, item)

    document.add_heading('2. Limitaciones', level=2)
    for item in [
        'El catálogo inicial de contenidos y ejercicios debe ampliarse de manera gradual.',
        'La capacidad de evaluación depende de los recursos asignados al worker y al sandbox.',
        'El uso responsable requiere cuentas institucionales, gestión de permisos y supervisión docente.',
        'Las integraciones y actualizaciones deben probarse antes de publicarse para no interrumpir las clases.',
    ]:
        add_bullet(document, item)

    document.add_heading('3. Conclusión', level=2)
    add_text(
        document,
        'Evaluador Automático EVA 3117 y Codi transforma dos desarrollos complementarios en un único '
        'sistema educativo. Codi aporta el camino para enseñar y practicar; EVA 3117 aporta la validación '
        'técnica, segura y objetiva de las soluciones. La propuesta responde a una necesidad institucional '
        'concreta y puede evolucionar mediante nuevos contenidos, ejercicios, lenguajes y mejoras de '
        'infraestructura sin perder su principio central: aprender y evaluar dentro de una misma experiencia.'
    )

    document.add_heading('Referencias', level=1)
    for reference in [
        'Documentación técnica interna del proyecto Codi y EVA 3117. (2026).',
        'Next.js. Documentación oficial.',
        'NestJS. Documentación oficial.',
        'PostgreSQL Global Development Group. Documentación de PostgreSQL.',
        'Olimpiada Informática Argentina. Recursos para programación competitiva.',
        'Reglamento de Prototipos ONIET 2026.',
    ]:
        add_text(document, reference)


document = Document(SOURCE)
table_style = document.tables[0].style
update_cover(document)
replace_index(document)
clear_report_body(document)
build_report(document, table_style)
document.save(OUTPUT)
