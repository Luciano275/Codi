from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Inches, Pt


DESKTOP = Path(r'C:\Users\marce\Desktop\codi')
ARCHITECTURE = Path(r'C:\Users\marce\Documents\Codi\architecture')
REPORT = DESKTOP / 'Informe_Evaluador_Automatico_EVA-3117_y_Codi.docx'


def remove_after(document: Document, start_paragraph) -> None:
    body = document.element.body
    remove = False
    for child in list(body):
        if child is start_paragraph._p:
            remove = True
        if remove and child.tag != qn('w:sectPr'):
            body.remove(child)


def reset_contents_page(document: Document) -> None:
    title = next(paragraph for paragraph in document.paragraphs if paragraph.text == 'Tabla de contenido')
    summary = next(paragraph for paragraph in document.paragraphs if paragraph.text == 'Resumen')
    body = document.element.body
    children = list(body)
    title_index = children.index(title._p)
    summary_index = children.index(summary._p)

    for child in children[title_index + 1 : summary_index]:
        body.remove(child)

    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.runs[0].bold = True
    title.runs[0].font.size = Pt(12)
    placeholder = document.add_paragraph()
    title._p.addnext(placeholder._p)


def add_text(document: Document, text: str) -> None:
    paragraph = document.add_paragraph(text)
    paragraph.paragraph_format.space_after = Pt(6)


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


def add_figure(document: Document, relative_path: str, caption: str, width: float = 6.0) -> None:
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.add_run().add_picture(str(ARCHITECTURE / relative_path), width=Inches(width))
    add_caption(document, caption)


def add_table(document: Document, headers: list[str], rows: list[list[str]], style) -> None:
    table = document.add_table(rows=1, cols=len(headers))
    table.style = style
    for cell, value in zip(table.rows[0].cells, headers):
        cell.text = value
    for values in rows:
        cells = table.add_row().cells
        for cell, value in zip(cells, values):
            cell.text = value


def update_cover(document: Document) -> None:
    for paragraph in document.paragraphs:
        if paragraph.text == 'Evaluador Automático EVA 3117 y Codi':
            paragraph.runs[0].bold = True
        if paragraph.text == 'Sistema integrado de enseñanza y evaluación de programación':
            paragraph.text = 'Informe descriptivo - ONIET 2026 - Prototipos - Eje Libre - Complejidad tecnológica alta'
        if paragraph.text == 'Informe':
            paragraph.text = 'Evaluador Automático EVA 3117 y Codi'


def build_report(document: Document, table_style) -> None:
    document.add_page_break()
    document.add_heading('Resumen', level=1)
    add_text(
        document,
        'La Escuela de Educación Técnica N.° 3117 necesita reducir la distancia entre aprender a programar, '
        'practicar y recibir una devolución sobre cada solución. El proyecto integra Codi, una plataforma de '
        'recorridos, lecciones y laboratorio, con EVA 3117, un entorno de evaluación basado en el software libre '
        'Contest Management System (CMS). El aporte del equipo consiste en el despliegue y adaptación institucional, '
        'la configuración de concursos, problemas, casos de prueba y graders, y la transformación del uso de CMS '
        'en un entorno de aprendizaje y evaluación adecuado para una escuela secundaria. Codi y EVA 3117 son un '
        'solo sistema con base de datos compartida y sincronización total. El eje elegido es Libre, en el área de educación, porque combina una necesidad '
        'pedagógica local con infraestructura, seguridad y automatización de evaluaciones. Los indicadores de uso, '
        'tiempos de veredicto y opiniones de estudiantes y docentes se incorporarán en la sección 9 a partir del '
        'relevamiento planificado.'
    )

    document.add_heading('1. Problema', level=1)
    document.add_heading('1.1 Contexto institucional', level=2)
    add_text(
        document,
        'La E.E.T. N.° 3117 Maestro Daniel Óscar Reyes forma estudiantes en Informática. En las prácticas de '
        'programación, el aprendizaje requiere una secuencia: comprender un concepto, resolver un problema, '
        'probar una solución y analizar el resultado. Cuando estas etapas se distribuyen entre materiales, '
        'editores y correcciones manuales, el docente invierte tiempo en tareas repetitivas y el estudiante recibe '
        'la devolución cuando ya perdió el contexto de su razonamiento.'
    )
    document.add_heading('1.2 Situación problemática', level=2)
    add_text(
        document,
        'Problema central: la institución necesita un sistema único que acompañe el aprendizaje de programación y '
        'evalúe soluciones de manera consistente, rápida y segura, sin reemplazar el acompañamiento docente.'
    )
    add_text(
        document,
        'El relevamiento institucional medirá cantidad de cursos, estudiantes, docentes, entregas por práctica y '
        'demora de devolución. Estos datos no se consignan todavía porque deben provenir de encuestas y registros '
        'reales; la metodología y el espacio para sus resultados se presentan en el capítulo 9. Durante el cursado, '
        'la necesidad fue observada por el equipo al enfrentar ejercicios cuya corrección manual demoraba la '
        'retroalimentación y reducía el tiempo disponible para explicar estrategias y errores particulares.'
    )
    document.add_heading('1.3 Fundamentación', level=2)
    add_text(
        document,
        'La retroalimentación es más útil cuando permite al estudiante comprender la diferencia entre su resultado '
        'actual y el esperado, y decidir cómo mejorar (Hattie & Timperley, 2007). En programación, un juez '
        'automático es un sistema que compila o ejecuta una solución y la contrasta con casos de prueba definidos. '
        'Un caso de prueba es una entrada preparada junto con la salida esperada que permite verificar un requisito '
        'del problema. El veredicto es el resultado formal de esa comparación, por ejemplo aceptado, respuesta '
        'incorrecta, error de compilación, error de ejecución, límite de tiempo o límite de memoria. Un sandbox es '
        'un entorno aislado y restringido donde se ejecuta código sin otorgarle acceso a los servicios internos ni '
        'a Internet. La evaluación formativa requiere que esa información permita tomar decisiones para mejorar '
        '(Black & Wiliam, 1998). Por eso, la automatización no elimina al docente: automatiza verificaciones '
        'repetibles y deja al docente el análisis conceptual, la orientación y la intervención pedagógica.'
    )
    document.add_heading('1.4 Soluciones existentes y diferencial', level=2)
    add_text(
        document,
        'La revisión de alternativas no identificó una plataforma pública equivalente, implementada para una escuela '
        'secundaria de Salta, que combine recorridos pedagógicos propios, islas temáticas, competencias y evaluación '
        'sobre una misma base de datos. Esta afirmación describe el relevamiento local realizado por el equipo; no '
        'pretende afirmar que no existan otras iniciativas en Argentina. Las plataformas comparadas cubren partes '
        'del problema y constituyen antecedentes técnicos o pedagógicos.'
    )
    add_table(
        document,
        ['Solución', 'Aporte principal', 'Diferencial de Codi + EVA 3117'],
        [
            ['CMS', 'Sistema distribuido para ejecutar y organizar concursos, tareas y puntajes.', 'Codi y EVA reutilizan su estructura y la adecuan al contexto pedagógico secundario.'],
            ['DOMjudge', 'Juez libre para concursos, con foco en seguridad, usabilidad y lenguajes modulares.', 'No ofrece las islas, lecciones, progresión y motivadores propios de Codi.'],
            ['OmegaUp', 'Plataforma web de práctica y concursos de programación.', 'No es una instalación institucional de la escuela con recorridos y datos propios.'],
            ['Juez OIA', 'Entorno de evaluación orientado a problemas de olimpíada.', 'No integra recorridos por áreas, gestión pedagógica y competencias escolares propias.'],
            ['Mumuki', 'Plataforma de enseñanza con ejercicios autoevaluables, contenido y reportes.', 'No combina en una misma instalación escolar los concursos CMS y la estructura de Codi.'],
            ['Codi + EVA 3117', 'Islas de aprendizaje, contenidos, concursos y evaluación.', 'Un solo sistema escolar, basado en CMS, con datos compartidos y uso adaptado a la institución.'],
        ],
        table_style,
    )

    document.add_heading('2. Objetivos', level=1)
    document.add_heading('2.1 Objetivo general', level=2)
    add_text(
        document,
        'Implementar un ecosistema institucional de enseñanza y evaluación de programación en el que Codi guíe '
        'el aprendizaje y EVA 3117 evalúe soluciones con criterios técnicos verificables.'
    )
    document.add_heading('2.2 Objetivos específicos', level=2)
    for item in [
        'Organizar contenidos de programación en islas, módulos, lecciones y actividades progresivas.',
        'Permitir al estudiante practicar y revisar soluciones en un laboratorio web.',
        'Configurar problemas, graders y casos de prueba para evaluaciones reproducibles.',
        'Registrar envíos, puntajes y veredictos para sostener el seguimiento docente.',
        'Reducir la corrección manual repetitiva y aumentar el tiempo de acompañamiento individual.',
        'Medir el uso, los reintentos, los tiempos de veredicto y la percepción de los usuarios.',
    ]:
        add_bullet(document, item)
    document.add_heading('2.3 Hipótesis', level=2)
    add_text(
        document,
        'Si Codi organiza el aprendizaje y EVA 3117 automatiza la evaluación técnica, entonces los estudiantes '
        'recibirán devoluciones más oportunas, podrán reintentar con mayor autonomía y los docentes dispondrán '
        'de información para acompañar dificultades concretas. La validación será parcial o total según los datos '
        'de pruebas técnicas y de usuarios del capítulo 9.'
    )

    document.add_heading('3. Destinatarios', level=1)
    document.add_heading('3.1 Alumnos y docentes', level=2)
    add_text(
        document,
        'Los destinatarios directos son seis cursos de la orientación Informática, con una estimación de 25 '
        'estudiantes por curso: aproximadamente 150 estudiantes alcanzados por Codi y EVA 3117. El sistema '
        'acompaña prácticas de aula, simulacros y concursos institucionales. Para el próximo ciclo lectivo se '
        'prevé la participación de cuatro o más docentes desde el comienzo del año, utilizando Codi para '
        'contenidos y EVA 3117 para instancias de evaluación.'
    )
    document.add_heading('3.2 Institución y otras escuelas técnicas', level=2)
    add_text(
        document,
        'La institución obtiene una plataforma propia para organizar actividades y evidencias de aprendizaje. Otra '
        'escuela técnica puede replicarla si dispone de conectividad, un servidor o servicio de despliegue, cuentas '
        'de administración, responsables docentes para los contenidos y cumplimiento de la licencia AGPL del CMS.'
    )
    document.add_heading('3.3 Alcance y resguardo de datos', level=2)
    add_text(
        document,
        'El alcance incluye contenidos, prácticas, concursos, usuarios, envíos y resultados académicos. Se limita '
        'al uso con cuentas autorizadas y a la mínima información necesaria para identificar al participante. '
        'No se publican datos personales de estudiantes menores de edad; los permisos se asignan por rol, los '
        'resultados se muestran al usuario y docente correspondiente, y el código se ejecuta aislado. La gestión '
        'debe respetar la Ley argentina 25.326 de Protección de Datos Personales.'
    )

    document.add_heading('4. Eje elegido', level=1)
    add_text(
        document,
        'El proyecto se presenta en Eje Libre, área educación, porque responde a una necesidad de enseñanza '
        'detectada en la escuela y no se reduce a un producto de software. Su complejidad tecnológica es alta: '
        'combina una aplicación web, autenticación, persistencia de progreso, administración de contenidos, '
        'configuración de concursos, evaluación asíncrona, colas de trabajo y ejecución aislada de código.'
    )

    document.add_heading('5. Materiales', level=1)
    document.add_heading('5.1 Hardware', level=2)
    add_text(
        document,
        'EVA 3117 se despliega sobre un servidor de pared/rack reutilizado por la institución: procesador Intel Xeon '
        'a 3.2 GHz, 8 GB de RAM, 512 GB de almacenamiento y placa base Intel Server Board S1200BTL. Posee acceso '
        'protegido por contraseña y una fuente Cromax Potencia 600 W, modelo KC-DAA-600. El servidor utiliza Ubuntu '
        'Server 22.04 LTS para centralizar servicios, administrar actualizaciones y separar la administración del '
        'uso en los equipos de aula. Recuperar este equipo evitó adquirir un servidor nuevo y convierte infraestructura '
        'sin uso en un recurso didáctico sostenible.'
    )
    add_figure(
        document,
        'resgistrofotografico/hardware.jpeg',
        'Figura 1. Componentes recuperados y armado del servidor institucional.',
        5.4,
    )
    add_figure(
        document,
        'resgistrofotografico/intalacion SO.jpeg',
        'Figura 2. Preparación del medio de instalación de Ubuntu Server.',
        5.0,
    )
    add_text(
        document,
        'La recuperación fue compleja porque no existía un servidor armado: gabinete, fuente de alimentación, '
        'placa, memoria RAM y otros componentes estaban distribuidos entre los talleres de Hardware e Informática. '
        'El equipo los relevó, reunió y ensambló, verificó el encendido, instaló Ubuntu Server y configuró el '
        'servicio. La cronología de trabajo incluye el relevamiento de piezas el 12 de mayo, el ensamblado y '
        'verificación el 16 de mayo, y la instalación inicial del sistema operativo el 20 de mayo de 2026.'
    )
    document.add_heading('5.2 Red', level=2)
    add_text(
        document,
        'La arquitectura es local e híbrida. EVA 3117 se mantiene local dentro de la institución para las '
        'instancias de examen y concurso; Codi utiliza un acceso híbrido que permite estudiar desde la escuela o '
        'desde el hogar con una cuenta autorizada. La red transporta solicitudes web entre Codi, EVA, la API y la '
        'base de datos compartida. La segmentación, las credenciales y el uso de HTTPS reducen la exposición de '
        'cuentas y resultados. Para las pruebas se incorporaron cables UTP, fichas RJ45 y un switch dedicado, '
        'renovando los tramos necesarios de una red preexistente que no contaba con las condiciones requeridas.'
    )
    add_figure(
        document,
        'resgistrofotografico/cableado.jpeg',
        'Figura 3. Cableado y switch utilizados para renovar la conectividad de prueba.',
        3.5,
    )
    document.add_heading('5.3 Software', level=2)
    add_table(
        document,
        ['Componente', 'Uso y justificación'],
        [
            ['Codi / Next.js / React', 'Interfaz de aprendizaje; permite rutas, lecciones y laboratorio web actualizables.'],
            ['NestJS', 'API con módulos, autenticación y reglas de negocio mantenibles.'],
            ['PostgreSQL / Prisma', 'Persistencia de usuarios, progreso, problemas y envíos con tipado de datos.'],
            ['Redis y cola', 'Coordinación de trabajos de evaluación sin bloquear la interfaz.'],
            ['CMS (AGPL)', 'Base libre para concursos, tareas, datasets, graders y administración de EVA 3117.'],
            ['Sandbox de evaluación', 'Ejecución restringida de código con control de comandos, tiempo, memoria y red.'],
        ],
        table_style,
    )
    add_text(
        document,
        'El costo de energía eléctrica aún no está consolidado y por ese motivo no se incorpora al total. No fue '
        'necesario adquirir licencias pagas: las tecnologías se eligieron deliberadamente para evitar gastos '
        'innecesarios y permitir mantenimiento con software libre.'
    )
    add_text(
        document,
        'Codi y EVA 3117 parten de Contest Management System (CMS), software libre distribuido bajo GNU Affero '
        'General Public License. El equipo no lo presenta como una creación desde cero: reutiliza su estructura y '
        'la transforma para una escuela secundaria mediante el despliegue institucional, una interfaz y flujos de '
        'uso propios, la configuración de usuarios y concursos, la carga de problemas, datasets, casos de prueba '
        'y graders. Ambos componentes forman un solo sistema y comparten la misma base de datos, por lo que los '
        'usuarios, actividades, envíos y resultados se sincronizan de forma total.'
    )
    document.add_heading('5.4 Costos', level=2)
    add_table(
        document,
        ['Componente', 'Origen', 'Costo'],
        [
            ['Hardware del servidor (Intel Xeon, 8 GB RAM, 512 GB)', 'Reutilizado de la institución (equipo sin uso)', '$0'],
            ['Cables UTP y switch', 'Infraestructura nueva para probar el evaluador', '$6.000 en fichas RJ45 y cable UTP; $21.000 en switch'],
            ['Sistema operativo (Ubuntu Server 22.04 LTS)', 'Software libre, descarga gratuita', '$0'],
            ['Plataforma evaluadora (CMS)', 'Software libre, clonado desde GitHub', '$0'],
            ['Lenguajes (Python, GCC, OpenJDK)', 'Software libre, instalación desde repositorios', '$0'],
            ['Base de datos (PostgreSQL 15)', 'Software libre, instalación desde repositorios', '$0'],
            ['Servidor web (Nginx)', 'Software libre, instalación desde repositorios', '$0'],
            ['Instalación y configuración (150 horas)', 'Realizada por alumnos del equipo del proyecto', '$0'],
            ['Costo total', '', '$27.000'],
        ],
        table_style,
    )

    document.add_heading('6. Funcionamiento', level=1)
    document.add_heading('6.1 Descripción general del sistema integrado', level=2)
    add_text(
        document,
        'La innovación central es articular aprendizaje y evaluación dentro de un solo sistema. Codi presenta el '
        'recorrido de aprendizaje, contenidos, progreso, laboratorio, recompensas y ranking; EVA 3117 administra '
        'concursos, tareas, casos de prueba, graders y veredictos. Ambos componentes nacen de CMS y comparten la '
        'misma base de datos: usuarios, actividades, envíos y resultados se mantienen sincronizados. La diferencia '
        'no se limita a la apariencia: transforma la forma de organizar y utilizar la información de un juez de '
        'competencias para adecuarla al aprendizaje de estudiantes de una escuela secundaria.'
    )
    add_figure(document, 'images/dashboard.png', 'Figura 4. Codi organiza el recorrido del estudiante mediante islas y módulos.')
    document.add_heading('6.2 Arquitectura', level=2)
    add_text(
        document,
        'El recorrido técnico es: Codi -> API -> cola de evaluación -> worker -> sandbox -> veredicto -> Codi. '
        'La API valida identidad y permisos; la cola evita bloquear la interfaz; el worker recupera la configuración '
        'de la tarea; y el sandbox ejecuta solamente comandos permitidos, sin acceso a Internet. La configuración '
        'de cada dataset define los límites de tiempo y memoria. En los problemas de prueba Amás B y Ecuación '
        'cuadrática se configuraron 1 segundo de ejecución y 256 MiB de memoria. La memoria RAM disponible del '
        'servidor limita la operación actual a 24 usuarios simultáneos; la ampliación de RAM permite aumentar esa '
        'capacidad en una etapa posterior.'
    )
    add_figure(
        document,
        'codi-runtime-architecture.visual-check.2048x1320.dark.png',
        'Figura 5. Arquitectura de ejecución: Codi, API, cola, worker y sandbox de evaluación.',
    )
    document.add_heading('6.3 Recorrido del estudiante en Codi', level=2)
    add_text(
        document,
        'Las islas representan áreas de aprendizaje y convierten una lista extensa de temas en una ruta visible. '
        'La isla de Programación Competitiva reúne algoritmos, estructuras de datos, desafíos OIA y simulacros; la '
        'isla de Programación Mobile orienta el aprendizaje a la creación de aplicaciones y experiencias para '
        'dispositivos móviles. Cada isla contiene cursos, módulos, lecciones, práctica y desafíos. El estudiante '
        'obtiene experiencia y gemas por la participación, accede a ranking y puede participar en eventos o '
        'concursos individuales y grupales. Estos elementos no reemplazan la evaluación académica: hacen visible '
        'el progreso y sostienen la motivación.'
    )
    add_figure(document, 'images/laboratorio.png', 'Figura 6. Laboratorio de Codi para leer, practicar y revisar una solución.')
    document.add_heading('6.4 Evaluación en EVA 3117', level=2)
    add_text(
        document,
        'EVA 3117 es la instancia de concurso y envío de Codi, construida sobre CMS adaptado. El estudiante elige '
        'el simulacro, consulta el enunciado, selecciona el lenguaje permitido y carga una solución. Al compartir '
        'la base de datos con Codi, cada envío y resultado queda disponible en el mismo ecosistema. Los veredictos posibles '
        'incluyen solución aceptada, respuesta incorrecta, error de compilación, error de ejecución, límite de '
        'tiempo y límite de memoria. Las capturas incorporadas identifican explícitamente a EVA 3117 como una '
        'interfaz institucional construida sobre CMS, no como una plataforma de juez creada desde cero.'
    )
    add_figure(document, 'eva/dashboard.png', 'Figura 7. EVA 3117: panel de un simulacro institucional basado en CMS.')
    add_figure(document, 'eva/task.png', 'Figura 8. EVA 3117: envío e historial de una tarea evaluada en C++.')
    add_text(
        document,
        'La evidencia visual de veredictos de Python, C++ y Java debe obtenerse en una prueba controlada. En la '
        'versión actual de Codi, la evaluación integrada soporta Python y C++; Java se administra como lenguaje '
        'permitido en CMS, pero no debe declararse integrado a Codi hasta completar esa implementación y prueba.'
    )
    add_figure(document, 'images/100puntos.png', 'Figura 9. Codi: solución aceptada con 100 puntos.')
    add_figure(document, 'images/0puntos.png', 'Figura 10. Codi: devolución ante una solución no aceptada.')
    add_figure(document, 'eva/compilation_error.png', 'Figura 11. EVA 3117: detalle de compilación y consumo de memoria.')
    document.add_heading('6.5 Administración docente', level=2)
    add_text(
        document,
        'Desde Codi, el docente organiza recorridos, módulos y lecciones. Desde EVA 3117, configura concursos, '
        'crea tareas, activa lenguajes, carga datasets, casos de prueba y graders, habilita preguntas y consulta '
        'entregas. El procedimiento documentado es: crear concurso, registrar usuarios, crear tarea, cargar '
        'dataset y casos, definir límites, habilitar lenguajes, publicar y revisar resultados.'
    )
    add_figure(document, 'eva/contest.png', 'Figura 12. EVA 3117: configuración de concurso en CMS adaptado bajo licencia AGPL.')
    add_figure(document, 'eva/users.png', 'Figura 13. EVA 3117: administración de usuarios para el uso institucional.')
    document.add_heading('6.6 Modo de uso', level=2)
    for step in [
        'El docente prepara contenidos en Codi y configura el concurso, problema, casos y límites en EVA 3117.',
        'El estudiante inicia sesión, recorre una lección y practica en el laboratorio de Codi.',
        'Para un simulacro o concurso, el estudiante ingresa a EVA 3117 y envía su archivo en el lenguaje habilitado.',
        'Codi y EVA 3117 registran la actividad en la base compartida y devuelven el resultado al mismo ecosistema.',
        'El estudiante consulta el veredicto, identifica el error y realiza un nuevo intento.',
        'El docente revisa entregas, progreso y consultas para decidir refuerzos o nuevas actividades.',
    ]:
        add_bullet(document, step)

    document.add_heading('7. Proceso de desarrollo', level=1)
    document.add_heading('7.1 Origen y evolución de EVA a EVA + Codi', level=2)
    add_text(
        document,
        'EVA 3117 comenzó el 7 de mayo de 2026 como respuesta a la necesidad de disponer de un juez y entorno '
        'de concursos para la escuela. La decisión técnica fue adoptar CMS como base de código abierto y realizar '
        'una implementación institucional. Codi comenzó el 7 de julio de 2026, dos meses después, para cubrir '
        'una necesidad complementaria: no solo evaluar una entrega, sino organizar la enseñanza previa, la práctica '
        'y el seguimiento. La primera prueba con usuarios se realizó el 9 de junio de 2026 en el laboratorio de '
        'Informática; el primer simulacro institucional se registró el 12 de junio de 2026.'
    )
    document.add_heading('7.2 Roles', level=2)
    add_text(
        document,
        'Los roles se distribuyeron entre diseño de experiencia, integración de servicios, configuración de EVA, '
        'pruebas, infraestructura y documentación. La nómina de esta sección debe coincidir con los cuatro '
        'integrantes definidos oficialmente en la portada antes de la presentación final.'
    )
    document.add_heading('7.3 Etapas y cronograma', level=2)
    add_table(
        document,
        ['Etapa', 'Evidencia', 'Dificultad y respuesta'],
        [
            ['7 de mayo de 2026: inicio de EVA 3117', 'Necesidad de juez institucional y base CMS.', 'Completar bitácora de recuperación y despliegue.'],
            ['Mayo-junio de 2026: configuración EVA', 'Concursos, usuarios, tareas, datasets y graders.', 'Documentar casos y límites por problema.'],
            ['9 de junio de 2026: piloto con usuarios', 'Uso del sistema en el laboratorio de Informática.', 'Registrar opiniones y métricas de los participantes.'],
            ['7 de julio de 2026: inicio de Codi', 'Islas, módulos, laboratorio, progreso y administración.', 'Separar experiencia pedagógica de la ejecución de código.'],
            ['Integración Codi + EVA 3117', 'Usuarios, actividades, envíos y resultados compartidos.', 'Mantener la sincronización y documentar cambios sobre CMS.'],
            ['Pruebas y documentación', 'Resultados técnicos y de usuarios.', 'Incorporar evidencias y gráficos del piloto.'],
        ],
        table_style,
    )
    document.add_heading('7.4 Dificultades y mejoras', level=2)
    for item in [
        'Diferenciar autoría: se corrigió la documentación para atribuir CMS y describir el trabajo propio sobre esa base.',
        'Evitar ejecutar código en la aplicación principal: se separó la evaluación mediante cola, worker y sandbox.',
        'Adecuar CMS a una escuela secundaria: se transformaron la interfaz, los flujos de uso y el aprovechamiento de los datos.',
        'Convertir prácticas aisladas en recorrido: se incorporaron islas, módulos, lecciones, progreso y motivadores.',
    ]:
        add_bullet(document, item)

    document.add_heading('8. Impacto esperado', level=1)
    document.add_heading('8.1 Beneficios para alumnos, docentes e institución', level=2)
    add_text(
        document,
        'Para el estudiante se espera una devolución más cercana al intento y mayor autonomía para revisar una '
        'solución. Para el docente, menos corrección repetitiva y más información para acompañar dificultades. '
        'Para la institución, un entorno propio que combina formación, práctica, simulacros y competencias. El '
        'impacto se medirá con tiempos de veredicto, reintentos, tasa de aprobación, encuestas y testimonios.'
    )
    document.add_heading('8.2 Sostenibilidad y replicabilidad', level=2)
    add_text(
        document,
        'El proyecto puede sostenerse porque separa contenidos, aplicación y evaluación, permite actualizar '
        'módulos y problemas sin reinstalar software en cada equipo y reutiliza hardware disponible. Puede '
        'replicarse en otra escuela con un responsable docente, una persona técnica, conectividad, un servidor '
        'o servicio equivalente, base de datos, copias de seguridad, cuentas institucionales y cumplimiento de '
        'la AGPL al distribuir modificaciones del CMS. Su ampliación contempla más cursos, nuevos problemas, '
        'eventos interescuelas y lenguajes que hayan sido integrados y probados.'
    )
    document.add_heading('8.3 Limitaciones y próximos pasos', level=2)
    add_table(
        document,
        ['Limitación actual', 'Próximo paso verificable'],
        [
            ['Datos de uso todavía no consolidados.', 'Aplicar encuestas y registrar métricas del piloto.'],
            ['Ampliar el alcance del sistema.', 'Incorporar más cursos, problemas, competencias y escuelas usuarias.'],
            ['Evidencia visual limitada de veredictos.', 'Capturar pruebas controladas para cada lenguaje y resultado esperado.'],
            ['Mantenimiento del servidor recuperado.', 'Registrar respaldos, actualizaciones y revisiones preventivas.'],
        ],
        table_style,
    )

    document.add_heading('9. Pruebas realizadas', level=1)
    document.add_heading('9.1 Metodología', level=2)
    add_text(
        document,
        'Las pruebas se organizan en dos niveles. El técnico verifica compilación, ejecución restringida, veredictos '
        'y concurrencia; el de usuarios observa cómo alumnos y docentes interactúan con Codi y EVA 3117. Cada '
        'caso registra fecha, responsable, entrada, resultado esperado, resultado observado, evidencia visual y '
        'ajuste aplicado. Esta metodología permite relacionar funcionamiento, utilidad, impacto y proceso documentado.'
    )
    add_text(
        document,
        'El 23 de septiembre de 2026 se ejecutaron las pruebas automatizadas disponibles del módulo de evaluación '
        'con el comando pnpm --filter @codi/api test. El resultado fue 5 de 5 pruebas aprobadas: cálculo GroupMin, '
        'selectores de CMS, compilación estática de C++ y dos verificaciones del comparador white diff. Estas pruebas '
        'respaldan componentes internos; no reemplazan las pruebas de carga, límites ni usuarios que siguen previstas.'
    )
    document.add_heading('9.2 Tabla de pruebas técnicas', level=2)
    add_table(
        document,
        ['Caso', 'Esperado', 'Resultado y evidencia'],
        [
            ['Pruebas automatizadas del evaluador', 'Cálculo, compilación y comparador sin fallas.', '23/09/2026: 5 de 5 pruebas aprobadas.'],
            ['Solución correcta', 'Aceptado y puntaje correspondiente.', 'Aceptado con 100 puntos; Figuras 9 y 10.'],
            ['Respuesta incorrecta', 'Puntaje parcial o nulo sin bloquear la plataforma.', 'Resultado de 30 y 0 puntos; Figuras 9 y 11.'],
            ['Error de compilación', 'Veredicto de compilación sin bloquear la plataforma.', 'Detalle de compilación y memoria; Figura 12.'],
            ['Bucle infinito', 'Límite de tiempo y terminación controlada.', 'Límite configurado de 1 segundo; captura de TLE pendiente.'],
            ['Exceso de memoria', 'Límite de memoria y veredicto controlado.', 'Límite configurado de 256 MiB; captura pendiente.'],
            ['Intento de acceso a red', 'Acceso denegado por sandbox.', 'El sandbox no habilita Internet; prueba visual pendiente.'],
            ['Envíos simultáneos', 'Cola procesa sin perder trabajos ni bloquear interfaz.', 'Capacidad actual estimada: 24 usuarios simultáneos por RAM.'],
        ],
        table_style,
    )
    document.add_heading('9.3 Usuarios con un curso', level=2)
    add_text(
        document,
        'El 9 de junio de 2026 se realizó una prueba con usuarios en el laboratorio de Informática. Los participantes '
        'realizaron varios intentos sobre las actividades propuestas y recibieron respuestas en menos de cuatro '
        'segundos, tanto desde Codi como desde EVA 3117. Los reintentos pueden configurarse desde la administración '
        'de EVA según el objetivo de cada instancia. La cantidad consolidada de participantes, envíos, reintentos '
        'hasta aprobar y opiniones se incorporará junto con los gráficos del relevamiento; cada gráfico indicará '
        'número de respuestas, fecha y pregunta asociada.'
    )
    add_figure(
        document,
        'resgistrofotografico/prueba.jpeg',
        'Figura 14. Prueba con usuarios realizada el 9 de junio de 2026 en el laboratorio de Informática.',
        5.9,
    )
    document.add_heading('9.4 Verificación de la hipótesis', level=2)
    add_text(
        document,
        'La hipótesis se confirma parcialmente con la prueba de usuarios del 9 de junio de 2026 y las pruebas '
        'técnicas documentadas: los participantes recibieron un veredicto en menos de cuatro segundos tanto en '
        'Codi como en EVA 3117, y pudieron reenviar una solución luego de revisar el resultado. La confirmación '
        'cuantitativa completa se consolidará cuando se incorporen los gráficos de encuesta, cantidad de envíos y '
        'opiniones de estudiantes y docentes.'
    )

    document.add_heading('10. Bibliografía consultada', level=1)
    for reference in [
        'Black, P., & Wiliam, D. (1998). Assessment and classroom learning. Assessment in Education, 5(1), 7-74. https://doi.org/10.1080/0969595980050102',
        'Cloudflare. (2026). Cloudflare Sandbox documentation. https://developers.cloudflare.com/sandbox/',
        'CMS Development Team. (2026). Contest Management System [Software]. GitHub. https://github.com/cms-dev/cms',
        'DOMjudge. (2026). DOMjudge documentation. https://www.domjudge.org/',
        'Hattie, J., & Timperley, H. (2007). The power of feedback. Review of Educational Research, 77(1), 81-112. https://doi.org/10.3102/003465430298487',
        'Mumuki. (2026). Mumuki. https://mumuki.io/',
        'NestJS. (2026). Documentation. https://docs.nestjs.com/',
        'Next.js. (2026). Documentation. https://nextjs.org/docs',
        'OmegaUp. (2026). OmegaUp. https://omegaup.com/',
        'República Argentina. (2000). Ley 25.326: Protección de los datos personales. https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790',
    ]:
        add_text(document, reference)


document = Document(REPORT)
table_style = document.tables[0].style
update_cover(document)
reset_contents_page(document)
summary = next(paragraph for paragraph in document.paragraphs if paragraph.text == 'Resumen')
remove_after(document, summary)
build_report(document, table_style)
document.save(REPORT)
