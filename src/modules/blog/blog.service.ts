import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Blog, Prisma } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: Prisma.BlogCreateInput) {
    const slug = slugify(data.title, { lower: true, strict: true });

    const isExists: Blog | null = await this.prisma.blog.findFirst({
      where: { slug },
    });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    return this.prisma.blog.create({
      data: { ...data, slug },
    });
  }

  async findAll(query: Record<string, any>): Promise<IGenericResponse<Blog[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.blog, query);
    const blogs = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: blogs };
  }

  async findOne(id: string) {
    const isBlogExists = await this.prisma.blog.findUnique({ where: { id } });

    if (!isBlogExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog Not Found');
    }

    return isBlogExists;
  }

  async update(id: string, data: Prisma.BlogUpdateInput) {
    const isBlogExists = await this.prisma.blog.findUnique({ where: { id } });

    if (data?.img) {
      await this.fileService.deleteFromDigitalOcean(data?.img as string);
    }

    if (!isBlogExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog Not Found');
    }

    return this.prisma.blog.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isBlogExists = await this.prisma.blog.findUnique({ where: { id } });

    if (isBlogExists?.img) {
      const ll = await this.fileService.deleteFromDigitalOcean(
        isBlogExists?.img as string,
      );

      console.log(`see ll`, ll);
    }

    if (!isBlogExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Blog Not Found');
    }

    return await this.prisma.blog.delete({
      where: { id },
    });
  }
}
