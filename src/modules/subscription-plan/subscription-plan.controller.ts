import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Request,
  Patch,
} from '@nestjs/common';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlanService } from './subscription-plan.service';
import { Role } from '@/enum/role.enum';
import { Roles } from '../roles/roles.decorator';

@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateSubscriptionPlanDto, @Request() req: any) {
    return this.subscriptionPlanService.createSubscriptionPlan(req.user, dto);
  }

  @Get()
  async findAllActive(@Query() query: Record<string, any>) {
    return this.subscriptionPlanService.getSubscriptionPlans(query);
  }

  @Get('admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAllForAdmin() {
    return this.subscriptionPlanService.getAdminSubscriptionPlans();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.subscriptionPlanService.getSubscriptionPlanById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionPlanService.updateSubscriptionPlan(id, dto);
  }

  @Get('customers')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getCustomers(@Query() query: Record<string, any>) {
    return this.subscriptionPlanService.getSubscriptionPlanCustomers(query);
  }
}
