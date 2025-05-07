import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '@/helper/prisma.service';
import QueryBuilder from '@/utils/query_builder';
import { IGenericResponse } from '@/interface/common';
import { Request } from 'express';
import { Prisma, Role } from '@prisma/client';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}
  async create(payload: CreateEventDto) {
    return await this.prisma.event.create({ data: payload });
  }

  async findAll(req: Request): Promise<IGenericResponse<Event>> {
    const query: Record<string, any> = req.query;
    const user = req.user as any;
    const role: Role = user.role;
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.event, query);
    const result = await queryBuilder
      .range()
      .search([])
      .filter([], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isAnswerExist = await this.prisma.event
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isAnswerExist) {
      isAnswerExist = await this.prisma.event.findUnique({
        where: { id },
      });
    }

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    return isAnswerExist;
  }

  async update(id: string, data: Prisma.EventUpdateInput) {
    const isAnswerExist = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    return this.prisma.event.update({
      where: { id },
      data: { ...data },
    });
  }

  async remove(id: string) {
    const isAnswerExist = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    return await this.prisma.event.delete({
      where: { id },
    });
  }
}
