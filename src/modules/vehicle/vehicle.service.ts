import { FileService } from '@/helper/file.service';
import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Vehicle, Prisma } from '@prisma/client';

@Injectable()
export class VehicleService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  async create(data: Prisma.VehicleCreateInput) {
    const isExists: Vehicle | null = await this.prisma.vehicle.findFirst({
      where: { name: data.name },
    });

    if (isExists) {
      throw new ApiError(HttpStatus.CONFLICT, 'Same Name Conflict');
    }

    return this.prisma.vehicle.create({
      data: { ...data },
    });
  }

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Vehicle[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.vehicle, query);
    const Vehicles = await queryBuilder
      .range()
      .search([])
      .filter(['title', 'slug'], [])
      .sort()
      .paginate()
      .fields()
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: Vehicles };
  }

  async findOne(id: string) {
    const isVehicleExists = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!isVehicleExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Vehicle Not Found');
    }

    return isVehicleExists;
  }

  async update(id: string, data: Prisma.VehicleUpdateInput) {
    const isVehicleExists = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!isVehicleExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Vehicle Not Found');
    }

    if (isVehicleExists.name === data.name) {
      throw new ApiError(HttpStatus.CONFLICT, 'Vehicle name already exists');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const isVehicleExists = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!isVehicleExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Vehicle Not Found');
    }

    return await this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
