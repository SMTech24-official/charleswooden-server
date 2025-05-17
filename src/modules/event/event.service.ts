import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from '@/helper/prisma.service';
import QueryBuilder from '@/utils/query_builder';
import { IGenericResponse } from '@/interface/common';
import { Request } from 'express';
import { Event, Prisma, Role } from '@prisma/client';
import { ApiError } from '@/utils/api_error';
import slugify from 'slugify';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(payload: any, images: string[]) {
    const slug = slugify(payload.title, { lower: true, strict: true });

    const isExists: Event | null = await this.prisma.event.findFirst({
      where: { slug },
    });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    const result = await this.prisma.event.create({
      data: { ...payload, slug },
    });

    const imagesData = Array.isArray(images)
      ? images.map((img: string) => ({
          url: img,
          eventId: result.id,
        }))
      : [];

    await this.prisma.image.createMany({ data: imagesData });

    return await this.prisma.event.findUnique({
      where: { id: result.id },
      include: {
        images: true,
      },
    });
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
      .include({
        images: true,
      })
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isEventExist = await this.prisma.event
      .findUnique({
        where: { id },
        include: {
          images: true,
        },
      })
      .catch(() => null);

    if (!isEventExist) {
      isEventExist = await this.prisma.event.findUnique({
        where: { slug: id },
        include: {
          images: true,
        },
      });
    }

    if (!isEventExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    return isEventExist;
  }

  async update(id: string, data: Prisma.EventUpdateInput, images: string[]) {
    let slug = '';

    if (data?.title) {
      slug = slugify(data?.title as string, { lower: true, strict: true });
    }

    const isEventExist = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!isEventExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    const result = await this.prisma.event.update({
      where: { id },
      data: { ...data, ...(slug ? { slug } : {}) },
    });

    const imagesData = Array.isArray(images)
      ? images.map((img: string) => ({
          url: img,
          eventId: result.id,
        }))
      : [];

    await this.prisma.image.createMany({ data: imagesData });

    return await this.prisma.event.findUnique({
      where: { id: result.id },
      include: {
        images: true,
      },
    });
  }

  async remove(id: string) {
    const isEventExist = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!isEventExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Event Not Found');
    }

    await this.prisma.image.deleteMany({
      where: { eventId: id },
    });

    const result = await this.prisma.event.delete({
      where: { id },
    });

    return result;
  }
}
