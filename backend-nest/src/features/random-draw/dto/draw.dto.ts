import { IsInt, Min } from 'class-validator';

export class DrawDto {
  /** How many items to pull this round. Clamped server-side to whatever is
   * actually left in the pool, so the last round never has to be "exact". */
  @IsInt()
  @Min(1)
  count: number;
}
