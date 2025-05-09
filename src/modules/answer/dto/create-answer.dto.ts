import { IsNumber, IsString } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  questionId: string;

  @IsNumber()
  answer: number;
}
