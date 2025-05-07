import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { Answer, Prisma, Role, User } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { Request } from 'express';
import { ApiError } from '@/utils/api_error';

@Injectable()
export class AnswerService {
  constructor(private prisma: PrismaService) {}
  async create(createAnswerDto: CreateAnswerDto[]) {
    await this.prisma.answer.createMany({ data: createAnswerDto });
    return 'answer submited successfully';
  }

  async findAll(req: Request): Promise<IGenericResponse<Answer[]>> {
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

    const queryBuilder = new QueryBuilder(this.prisma.answer, query);
    const result = await queryBuilder
      .range()
      .search([])
      .filter([], [])
      .sort()
      .paginate()
      .fields()
      .rawFilter({ ...(role === 'CUSTOMER' && { userId: user.id }) })
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }
  async findOne(id: string) {
    let isAnswerExist = await this.prisma.answer
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isAnswerExist) {
      isAnswerExist = await this.prisma.answer.findUnique({
        where: { id },
      });
    }

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Answer Not Found');
    }

    return isAnswerExist;
  }

  async update(id: string, data: Prisma.AnswerUpdateInput) {
    const isAnswerExist = await this.prisma.answer.findUnique({
      where: { id },
    });

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Amswer Not Found');
    }

    return this.prisma.answer.update({
      where: { id },
      data: { ...data },
    });
  }

  async remove(id: string) {
    const isAnswerExist = await this.prisma.answer.findUnique({
      where: { id },
    });

    if (!isAnswerExist) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Answer Not Found');
    }

    return await this.prisma.answer.delete({
      where: { id },
    });
  }
}
