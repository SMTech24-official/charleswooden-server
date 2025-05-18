import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { Public } from '../auth/auth.decorator';
import { ResponseService } from '@/utils/response';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Get('analytics')
  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  analytics(@Query() query: Record<string, any>) {
    const result = this.adminService.getDashboardAnalytics(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admins Updated successfully',
      data: result,
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: Record<string, any>) {
    const result = this.adminService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admins Found successfully',
      data: result,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    const result = this.adminService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    const result = this.adminService.update(id, updateAdminDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  remove(@Param('id') id: string) {
    const result = this.adminService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Admin Deleted successfully',
      data: result,
    });
  }
}
