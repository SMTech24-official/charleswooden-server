import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FeedBack, Prisma } from '@prisma/client';

@Injectable()
export class FeedBackService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: Prisma.FeedBackCreateInput) {
    return this.prisma.feedBack.create({
      data: { ...data },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<FeedBack[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.feedBack, query);
    const FeedBacks = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: FeedBacks };
  }

  async findOne(id: string) {
    const isFeedBackExists = await this.prisma.feedBack.findUnique({
      where: { id },
    });

    if (!isFeedBackExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'FeedBack Not Found');
    }

    return isFeedBackExists;
  }

  async update(id: string, data: Prisma.FeedBackUpdateInput) {
    const isFeedBackExists = await this.prisma.feedBack.findUnique({
      where: { id },
    });

    if (isFeedBackExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'FeedBack name already exists');
    }

    if (!isFeedBackExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'FeedBack Not Found');
    }

    return this.prisma.feedBack.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isFeedBackExists = await this.prisma.feedBack.findUnique({
      where: { id },
    });

    if (!isFeedBackExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'FeedBack Not Found');
    }

    return await this.prisma.feedBack.delete({
      where: { id },
    });
  }
}
