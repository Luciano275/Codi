import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RankingRewardSettingDto {
  @IsInt()
  @Min(1)
  @Max(3)
  position!: number;

  @IsString()
  @MaxLength(80)
  title!: string;

  @IsInt()
  @Min(0)
  @Max(100000)
  gems!: number;
}

export class UpdateRankingRewardsDto {
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => RankingRewardSettingDto)
  rewards!: RankingRewardSettingDto[];
}
