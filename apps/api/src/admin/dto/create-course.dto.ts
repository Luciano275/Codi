import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString() title!: string;

  @IsString() slug!: string;

  @IsInt() level!: number;

  @IsString() region!: string;

  @IsOptional() @IsInt() @Min(0) xpReward?: number;

  @IsInt() @Min(1) order!: number;
}
