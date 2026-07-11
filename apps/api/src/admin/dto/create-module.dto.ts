import { IsString, IsInt, Min, MaxLength } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  courseId!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsInt()
  @Min(1)
  order!: number;
}
