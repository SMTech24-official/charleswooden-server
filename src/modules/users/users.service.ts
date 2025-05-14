import { PrismaService } from '@/helper/prisma.service';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role, User } from '@prisma/client';
import { ApiError } from 'src/utils/api_error';
import { BcryptService } from 'src/utils/bcrypt.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private readonly configService: ConfigService,
  ) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createAdmin(data: CreateAdminDto): Promise<User | null> {
    const { admin: adminData, ...userData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      userData.role = Role.ADMIN;

      if (!userData.password) {
        userData.password = this.configService.get<string>('ADMIN_PASSWORD');
      }

      userData.password = await this.bcryptService.hash(userData.password);

      const userCreation = await tx.user.create({
        data: userData,
      });

      const adminCreation = await tx.admin.create({
        data: {
          ...adminData,
          userId: userCreation?.id,
        },
      });

      if (!userCreation || !adminCreation) {
        throw new ApiError(
          HttpStatus.NOT_FOUND,
          'Failed to create admin and user',
        );
      }

      return userCreation;
    });

    return await this.prisma.user.findUnique({
      where: { id: result?.id },
      include: { admin: true },
    });
  }

  async createCustomer(data: CreateCustomerDto): Promise<User | null> {
    const { customer: customerData, ...userData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      userData.role = Role.CUSTOMER;

      if (!userData.password) {
        userData.password = this.configService.get<string>('ADMIN_PASSWORD');
      }

      userData.password = await this.bcryptService.hash(userData.password);

      const userCreation = await tx.user.create({
        data: userData,
      });

      const customerCreation = await tx.customer.create({
        data: {
          ...customerData,
          userId: userCreation?.id,
        },
      });

      if (!userCreation || !customerCreation) {
        throw new ApiError(
          HttpStatus.NOT_FOUND,
          'Failed to create customer and user',
        );
      }

      return userCreation;
    });

    return await this.prisma.user.findUnique({
      where: { id: result?.id },
      include: { customer: true },
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async getOne(data: { email: string }): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.email }],
      },
      include: { admin: true, customer: true },
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async updatePassword({ id, password }: { id: string; password: string }) {
    return this.prisma.user.update({ where: { id }, data: { password } });
  }
}
