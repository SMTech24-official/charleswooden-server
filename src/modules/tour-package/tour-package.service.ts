import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { TourPackage, Prisma } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class TourPackageService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: Prisma.TourPackageCreateInput) {
    const slug = slugify(data.title, { lower: true, strict: true });

    const isExists: TourPackage | null =
      await this.prisma.tourPackage.findFirst({
        where: { slug },
      });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    return this.prisma.tourPackage.create({
      data: { ...data, slug },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<TourPackage[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.tourPackage, query);
    const TourPackages = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: TourPackages };
  }

  async findOne(id: string) {
    const isTourPackageExists = await this.prisma.tourPackage.findUnique({
      where: { id },
    });

    if (!isTourPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourPackage Not Found');
    }

    return isTourPackageExists;
  }

  async update(id: string, data: Prisma.TourPackageUpdateInput) {
    const isTourPackageExists = await this.prisma.tourPackage.findUnique({
      where: { id },
    });

    const slug = slugify(data?.title as string, { lower: true, strict: true });

    if (data?.title) {
      const existingtourPackage = await this.prisma.tourPackage.findFirst({
        where: {
          title: slug,
          NOT: { id },
        },
      });

      if (existingtourPackage) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'tourPackage name already exists',
        );
      }
    }

    // if (Array.isArray(data?.images) && data?.images.length > 0) {
    //   await this.fileService.deleteFromDigitalOcean(data?.images[0] as string);
    // }

    if (!isTourPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourPackage Not Found');
    }

    return this.prisma.tourPackage.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isTourPackageExists = await this.prisma.tourPackage.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!isTourPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'TourPackage Not Found');
    }

    if (isTourPackageExists?.images?.length > 0) {
      await this.fileService.deleteMultipleFromDigitalOcean(
        isTourPackageExists?.images?.map((pkg) => pkg.url) as string[],
      );
    }

    return await this.prisma.tourPackage.delete({
      where: { id },
    });
  }
}
