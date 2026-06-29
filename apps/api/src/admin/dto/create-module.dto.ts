import { IsString, IsInt, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString() courseId!: string;

  @IsString() title!: string;

  @IsInt() @Min(1) order!: number;
}
