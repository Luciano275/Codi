import { RewardCategory, RewardType } from '@codi/database';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(300)
  description!: string;

  @IsEnum(RewardCategory)
  category!: RewardCategory;

  @IsInt()
  @Min(1)
  @Max(100000)
  cost!: number;

  @IsEnum(RewardType)
  type!: RewardType;

  @IsBoolean()
  isActive!: boolean;

  @IsIn(['exam', 'hint', 'double-xp'])
  visual!: 'exam' | 'hint' | 'double-xp';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  durationHours?: number;
}
