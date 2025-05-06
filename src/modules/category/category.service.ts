import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CategoryCreateInput) {
    const slug = slugify(data.name, { lower: true, strict: true });

    const isExists: Category | null = await this.prisma.category.findFirst({
      where: { slug },
    });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    return this.prisma.category.create({
      data: { ...data, slug },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Category[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.category, query);
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
    let isCategoryExists = await this.prisma.category
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isCategoryExists) {
      isCategoryExists = await this.prisma.category.findUnique({
        where: { slug: id },
      });
    }

    if (!isCategoryExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Category Not Found');
    }

    return isCategoryExists;
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    let slug = '';

    if (data?.name) {
      slug = slugify(data.name as string, { lower: true, strict: true });
    }

    const isCategoryExists = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!isCategoryExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Category Not Found');
    }

    return this.prisma.category.update({
      where: { id },
      data: { ...data, ...(slug ? { slug } : {}) },
    });
  }

  async remove(id: string) {
    const isCategoryExists = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!isCategoryExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Category Not Found');
    }

    return await this.prisma.category.delete({
      where: { id },
    });
  }
}
