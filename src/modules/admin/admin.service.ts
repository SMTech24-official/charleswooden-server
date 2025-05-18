import { PrismaService } from '@/helper/prisma.service';
import { IGenericResponse } from '@/interface/common';
import { ApiError } from '@/utils/api_error';
import QueryBuilder from '@/utils/query_builder';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Admin, Prisma, Role } from '@prisma/client';

type DailyCount = {
  date: string;
  events: number;
  reviews: number;
};
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

  // async analytics() {
  //   const result = await this.prisma.$transaction(async (tx) => {
  //     const events = await tx.event.count({});
  //     const currentEvents = await tx.event.count({
  //       where: {
  //         date: {
  //           lte: new Date().toISOString(),
  //         },
  //       },
  //     });
  //     const reviews = await tx.review.count();
  //     const users = await tx.user.count({ where: { role: Role.CUSTOMER } });
  //   });
  // }

  async getDashboardAnalytics(
    query?: Record<string, any>,
  ): Promise<{ all: any; day: DailyCount[] }> {
    const [bookingCount, clinicianCount] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.user.count(),
    ]);

    const days = query?.days;
    const whereClause = days
      ? { createdAt: { gte: this.getNDaysAgo(days) } }
      : {};

    const [bookingDates, clinicianDates] = await Promise.all([
      this.prisma.user.findMany({
        select: { createdAt: true },
        where: whereClause,
      }),
      this.prisma.event.findMany({
        select: { createdAt: true },
        where: whereClause,
      }),
    ]);

    const bookingMap = this.groupByDate(bookingDates.map((b) => b.createdAt));
    const clinicianMap = this.groupByDate(
      clinicianDates.map((c) => c.createdAt),
    );

    const allDates = days
      ? this.getDatesInRange(this.getNDaysAgo(days))
      : Array.from(
          new Set([...Object.keys(bookingMap), ...Object.keys(clinicianMap)]),
        ).sort();

    const dayArray = allDates.map((date) => ({
      date,
      events: bookingMap[date] || 0,
      reviews: clinicianMap[date] || 0,
    }));

    return {
      all: {
        events: bookingCount,
        reviews: clinicianCount,
      },
      day: dayArray,
    };
  }

  private getNDaysAgo(n: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date;
  }

  private groupByDate(timestamps: Date[]): Record<string, number> {
    const map: Record<string, number> = {};
    timestamps.forEach((date) => {
      const day = date.toISOString().split('T')[0];
      map[day] = (map[day] || 0) + 1;
    });
    return map;
  }

  private getDatesInRange(startDate: Date): string[] {
    const endDate = new Date();
    const dates: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
