import { IsIn, IsString, MaxLength } from 'class-validator';

export class ConsumeRewardDto {
  @IsIn(['PROBLEM', 'EXAM'])
  contextType!: 'PROBLEM' | 'EXAM';

  @IsString()
  @MaxLength(120)
  contextId!: string;
}
