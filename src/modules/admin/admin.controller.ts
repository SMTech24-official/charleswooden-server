import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { Public } from '../auth/auth.decorator';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('analytics')
  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  analytics(@Query() query: Record<string, any>) {
    return this.adminService.getDashboardAnalytics(query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: Record<string, any>) {
    return this.adminService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.adminService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(id, updateAdminDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }
}
