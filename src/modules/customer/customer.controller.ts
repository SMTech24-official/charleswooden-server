import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { ResponseService } from '@/utils/response';

@Controller('customers')
export class CustomerController {
  constructor(private readonly CustomerService: CustomerService) {}

  @Get()
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.SUPER_ADMIN)
  create(@Query() query: Record<string, any>) {
    const result = this.CustomerService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customers Found successfully',
      data: result,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    const result = this.CustomerService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const result = this.CustomerService.update(id, updateCustomerDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER)
  remove(@Param('id') id: string) {
    const result = this.CustomerService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Customer Deleted successfully',
      data: result,
    });
  }
}
