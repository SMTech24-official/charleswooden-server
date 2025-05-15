import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Review, Prisma } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create({
    data,
    images,
  }: {
    data: Prisma.ReviewCreateInput;
    images: string[];
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const revivewCreation = await tx.review.create({
        data: { ...data },
      });

      if (!revivewCreation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `review creation failed`);
      }

      if (images.length > 0) {
        const data = images?.map((e: string) => ({
          url: e,
          reviewId: revivewCreation?.id,
        }));
        await this.prisma.image.createMany({ data });
      }

      return await this.prisma.review.findUnique({
        where: { id: revivewCreation?.id },
      });
    });

    return result;
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Review[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.review, query);
    const Reviews = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: Reviews };
  }

  async findOne(id: string) {
    const isReviewExists = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!isReviewExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Review Not Found');
    }

    return isReviewExists;
  }

  async update({
    id,
    data,
    images,
  }: {
    id: string;
    data: Prisma.ReviewUpdateInput;
    images: string[];
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const isReviewExists = await tx.review.findUnique({
        where: { id },
      });

      if (!isReviewExists) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Review Not Found');
      }

      if (images.length > 0) {
        const data = images?.map((e) => ({
          url: e,
          reviewId: isReviewExists?.id,
        }));
        await tx.image.createMany({ data });
      }

      return tx.review.update({
        where: { id },
        data,
        include: { images: true },
      });
    });

    return result;
  }

  async remove(id: string) {
    const isReviewExists = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!isReviewExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Review Not Found');
    }

    return await this.prisma.review.delete({
      where: { id },
    });
  }

  async destroy(id: string) {
    const isImgExists = await this.prisma.image.findUnique({ where: { id } });

    if (!isImgExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `image not found!`);
    }

    if (isImgExists?.url) {
      await this.fileService.deleteFromDigitalOcean(isImgExists?.url);
    }

    return isImgExists;
  }
}
