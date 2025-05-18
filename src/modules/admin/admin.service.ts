import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Admin, Prisma, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    query: Record<string, any>,
  ): Promise<IGenericResponse<Admin[]>> {
    const populateFields = query.populate
      ? query.populate
          .split(',')
          .reduce((acc: Record<string, boolean>, field) => {
            acc[field] = true;
            return acc;
          }, {})
      : {};

    const queryBuilder = new QueryBuilder(this.prisma.user, query);
    const result = await queryBuilder
      .range()
      .search([])
      .filter([], [])
      .sort()
      .paginate()
      .fields()
      .rawFilter({ role: Role.ADMIN })
      .populate(populateFields)
      .execute();

    const meta = await queryBuilder.countTotal();

    return { meta, data: result };
  }

  async findOne(id: string) {
    let isAdminExists = await this.prisma.admin
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (!isAdminExists) {
      isAdminExists = await this.prisma.admin.findUnique({
        where: { userId: id },
      });
    }

    if (!isAdminExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Admin Not Found');
    }

    return await this.prisma.user.findUnique({
      where: { id: isAdminExists?.userId },
      include: { admin: true },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const { admin, ...user } = data;

    const isUserExists = await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      const adminUpdation = await this.prisma.admin.update({
        where: { id: isUserExists?.admin?.id },
        data: { ...(admin as any) },
      });

      if (!adminUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `admin updation failed`);
      }

      const userUpdation = await this.prisma.user.update({
        where: { id: isUserExists?.id },
        data: { ...user },
      });

      if (!userUpdation) {
        throw new ApiError(HttpStatus.NOT_FOUND, `user updated`);
      }
      return userUpdation;
    });

    return await this.prisma.user.findUnique({ where: { id: result?.id } });
  }

  async remove(id: string) {
    const isUserExists = await this.findOne(id);

    if (!isUserExists) {
      throw new ApiError(HttpStatus.NOT_FOUND, `user not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      const adminDeletion = await this.prisma.admin.delete({
        where: { id: isUserExists?.admin.id },
      });

      const userDeletion = await this.prisma.user.delete({
        where: { id: isUserExists.id },
      });
      return userDeletion;
    });

    return 'user deleted successfully';
  }
}
