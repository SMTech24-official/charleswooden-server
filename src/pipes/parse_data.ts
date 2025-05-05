// src/common/pipes/parse-data.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDataPipe implements PipeTransform {
  transform(value: any) {
    try {
      // If value is string, parse it first
      const data: any = typeof value === 'string' ? JSON.parse(value) : value;

      if (data && typeof data.data === 'string') {
        return JSON.parse(data.data); // inner JSON object
      }

      return data; // fallback
    } catch (error) {
      throw new BadRequestException('Invalid data format');
    }
  }
}
