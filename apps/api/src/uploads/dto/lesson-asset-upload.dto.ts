import { IsIn } from 'class-validator';
import type { UploadAssetType } from '../../s3/s3.constants';

export class LessonAssetUploadDto {
  @IsIn(['lesson-pdf', 'lesson-video'])
  assetType!: UploadAssetType;
}
