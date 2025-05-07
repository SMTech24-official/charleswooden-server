import { IsString, IsOptional, IsDateString, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  title: string;

  @IsString()
  @Length(1, 255)
  slug: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsDateString()
  date: string; // ISO 8601 format (e.g., "2025-06-15")

  @IsString()
  startTime: string; // e.g., "14:30"

  @IsString()
  endTime: string; // e.g., "16:00"
}
