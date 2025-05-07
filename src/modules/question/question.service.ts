import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Question, Prisma } from '@prisma/client';

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.QuestionCreateInput) {
    return this.prisma.question.create({
      data: { ...data },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Question[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.question, query);
    const Questions = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: Questions };
  }

  async findOne(id: string) {
    const isQuestionExists = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!isQuestionExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Question Not Found');
    }

    return isQuestionExists;
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    const isQuestionExists = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!isQuestionExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Question Not Found');
    }

    return this.prisma.question.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isQuestionExists = await this.prisma.question.findUnique({
      where: { id },
    });

    if (!isQuestionExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Question Not Found');
    }

    return await this.prisma.question.delete({
      where: { id },
    });
  }
}
