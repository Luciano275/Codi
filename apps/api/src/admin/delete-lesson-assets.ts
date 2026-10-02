import { S3Service } from '../s3/s3.service';

interface LessonAssetKeys {
  imageObjectKey: string | null;
  pdfObjectKey: string | null;
  videoObjectKey: string | null;
}

export async function deleteLessonAssets(s3: S3Service, lessons: LessonAssetKeys[]) {
  await Promise.all(
    lessons.flatMap((lesson) => [
      s3.deleteObject(lesson.imageObjectKey),
      s3.deleteObject(lesson.pdfObjectKey),
      s3.deleteObject(lesson.videoObjectKey),
    ]),
  );
}
