import { IsNumber, Max, Min } from 'class-validator';

// Brazilian 0-10 scale, two decimals of precision is enough for any school's
// rounding rule; the frontend can format as it likes.
export class GradeProjectDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  grade!: number;
}
