import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsInt()
  level!: number;

  @IsOptional() @IsInt() @Min(0) xpReward?: number;

  @IsInt() @Min(1) order!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  islandId?: string;
}
