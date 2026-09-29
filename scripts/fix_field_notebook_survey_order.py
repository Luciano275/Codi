from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


SOURCE = Path(r'C:\Users\marce\Desktop\codi\Carpeta de Campo EVA 3117 y codi.docx')
OUTPUT = Path(r'C:\Users\marce\Desktop\codi\Carpeta de Campo EVA 3117 y Codi - corregida.docx')

QUESTION_12_MEDIA = 'word/media/image88.jpeg'
QUESTION_1_MEDIA = 'word/media/image99.jpeg'


def clone_zip_info(zip_info: ZipInfo) -> ZipInfo:
    cloned = ZipInfo(zip_info.filename, zip_info.date_time)
    cloned.compress_type = ZIP_DEFLATED
    cloned.comment = zip_info.comment
    cloned.extra = zip_info.extra
    cloned.internal_attr = zip_info.internal_attr
    cloned.external_attr = zip_info.external_attr
    cloned.create_system = zip_info.create_system
    return cloned


def fix_survey_order() -> None:
    with ZipFile(SOURCE, 'r') as source_docx:
        question_12 = source_docx.read(QUESTION_12_MEDIA)
        question_1 = source_docx.read(QUESTION_1_MEDIA)

        with ZipFile(OUTPUT, 'w') as corrected_docx:
            for zip_info in source_docx.infolist():
                content = source_docx.read(zip_info.filename)
                if zip_info.filename == QUESTION_12_MEDIA:
                    content = question_1
                elif zip_info.filename == QUESTION_1_MEDIA:
                    content = question_12
                corrected_docx.writestr(clone_zip_info(zip_info), content)


if __name__ == '__main__':
    fix_survey_order()
    print(OUTPUT)
