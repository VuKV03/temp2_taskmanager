import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryStatsDto {
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}

export class QueryCompletionStatsDto extends QueryStatsDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}
