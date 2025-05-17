import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Answer, Prisma, Role } from '@prisma/client';
import { Request } from 'express';
import { CreateAnswerDto } from './dto/create-answer.dto';

@Injectable()
export class AnswerService {
  constructor(private prisma: PrismaService) {}
  async create(createAnswerDto: CreateAnswerDto[], user: any) {
    const isCustomerExists = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!isCustomerExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer Not Found');
    }

    const allData = createAnswerDto?.map((item) => {
      return { ...item, customerId: isCustomerExists.id };
    });

    console.dir(allData);

    const isExists = await this.prisma.answer.findMany({
      where: {
        AND: [
          { customerId: { in: allData.map((d) => d.customerId) } },
          { questionId: { in: allData.map((d) => d.questionId) } },
        ],
      },
      include: { question: true },
    });
    console.log(isExists);

    if (isExists?.length > 0) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        `Yo've Already Answered These Questions ${isExists.map((q) => q.question.question)}`,
      );
    }

    return await this.prisma.answer.createMany({ data: allData });
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
