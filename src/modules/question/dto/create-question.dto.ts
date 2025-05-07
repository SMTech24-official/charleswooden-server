import { IsMongoId, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  question: string;

  @IsMongoId()
  categoryId: string;
}
