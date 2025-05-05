import { IsMongoId, IsNumberString, IsString } from 'class-validator';

export class FindOneParams {
  @IsMongoId()
  id: string;
}
