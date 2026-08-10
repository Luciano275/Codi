import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class RedeemRewardDto {
  @IsUUID()
  requestId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  trimester?: number;
}
