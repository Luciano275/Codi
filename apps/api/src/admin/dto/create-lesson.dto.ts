import { IsString, IsOptional, IsInt, IsEnum, IsArray, IsObject, Min } from 'class-validator';
import { LessonType } from '@codi/database';

export class CreateLessonDto {
  @IsString()
  moduleId!: string;

  @IsString()
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
}
