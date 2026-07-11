import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  password!: string;
}
