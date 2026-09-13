import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const profileBanners = [
  'BOSQUE',
  'DESIERTO',
  'CASTILLO',
  'PRADERA',
  'ROSAL',
  'LAVANDA',
  'CORAL',
] as const;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUploadKey?: string;

  @IsOptional()
  @IsBoolean()
  removeAvatar?: boolean;

  @IsOptional()
  @IsIn(profileBanners)
  profileBanner?: (typeof profileBanners)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  xp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gems?: number;
}
