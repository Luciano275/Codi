import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(255)
  slug!: string;

  @IsInt()
  level!: number;

  @IsString()
  @MaxLength(100)
  region!: string;

  @IsOptional() @IsInt() @Min(0) xpReward?: number;

  @IsInt() @Min(1) order!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  islandId?: string;
}
