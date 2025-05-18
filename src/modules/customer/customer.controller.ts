import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { UpdateCustomerDto } from './dto/update-Customer.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';

@Controller('Customer')
export class CustomerController {
  constructor(private readonly CustomerService: CustomerService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN)
  create(@Query() query: Record<string, any>) {
    return this.CustomerService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN, Role.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.CustomerService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN, Role.CUSTOMER)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.CustomerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(Role.CUSTOMER, Role.SUPER_ADMIN, Role.CUSTOMER)
  remove(@Param('id') id: string) {
    return this.CustomerService.remove(id);
  }
}
