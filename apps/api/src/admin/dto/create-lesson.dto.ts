import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { LessonType } from '@codi/database';

export class CreateLessonDto {
  @IsString()
  moduleId!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsEnum(LessonType)
  type!: LessonType;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  problemIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(512)
  imageUploadKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pdfUploadKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  videoUploadKey?: string;

  @IsOptional()
  @IsBoolean()
  removePdf?: boolean;

  @IsOptional()
  @IsBoolean()
  removeImage?: boolean;

  @IsOptional()
  @IsBoolean()
  removeVideo?: boolean;
}
