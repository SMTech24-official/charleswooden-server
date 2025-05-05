import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { HotelPackage, Prisma } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class HotelPackageService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: Prisma.HotelPackageCreateInput) {
    const slug = slugify(data.title, { lower: true, strict: true });

    const isExists: HotelPackage | null =
      await this.prisma.hotelPackage.findFirst({
        where: { slug },
      });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    return this.prisma.hotelPackage.create({
      data: { ...data, slug },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<HotelPackage[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.hotelPackage, query);
    const HotelPackages = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: HotelPackages };
  }

  async findOne(id: string) {
    const isHotelPackageExists = await this.prisma.hotelPackage.findUnique({
      where: { id },
    });

    if (!isHotelPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'HotelPackage Not Found');
    }

    return isHotelPackageExists;
  }

  async update(id: string, data: Prisma.HotelPackageUpdateInput) {
    const isHotelPackageExists = await this.prisma.hotelPackage.findUnique({
      where: { id },
    });

    const slug = slugify(data?.title as string, { lower: true, strict: true });

    if (data?.title) {
      const existingHotelPackage = await this.prisma.hotelPackage.findFirst({
        where: {
          title: slug,
          NOT: { id },
        },
      });

      if (existingHotelPackage) {
        throw new ApiError(
          HttpStatus.CONFLICT,
          'HotelPackage name already exists',
        );
      }
    }

    // if (Array.isArray(data?.images) && data?.images.length > 0) {
    //   await this.fileService.deleteFromDigitalOcean(data?.images[0] as string);
    // }

    if (!isHotelPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'HotelPackage Not Found');
    }

    return this.prisma.hotelPackage.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isHotelPackageExists = await this.prisma.hotelPackage.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!isHotelPackageExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'HotelPackage Not Found');
    }

    if (isHotelPackageExists?.images?.length > 0) {
      await this.fileService.deleteMultipleFromDigitalOcean(
        isHotelPackageExists?.images?.map((pkg) => pkg.url) as string[],
      );
    }

    return await this.prisma.hotelPackage.delete({
      where: { id },
    });
  }
}
