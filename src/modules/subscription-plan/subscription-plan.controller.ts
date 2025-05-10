import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ParseDataPipe } from '@/pipes/parse_data';
import { ResponseService } from '@/utils/response';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { Public } from '../auth/auth.decorator';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionDto } from '../subscription/dto/create-subscription.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';

@Controller('subscription-plans')
export class SubscriptionPlanController {
  constructor(
    private readonly SubscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() createSubscriptionPlanDto: CreateSubscriptionPlanDto) {
    const data = JSON.parse(JSON.stringify(createSubscriptionPlanDto));
    const result = await this.SubscriptionPlanService.create({ ...data });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `SubscriptionPlan created successfully`,
      data: result,
    });
  }

  @Public()
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.SubscriptionPlanService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all SubscriptionPlans found successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.SubscriptionPlanService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single SubscriptionPlan found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateSubscriptionPlanDto?: string,
  ) {
    const data = JSON.parse(JSON.stringify(updateSubscriptionPlanDto));
    const result = await this.SubscriptionPlanService.update(id, {
      ...data,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `SubscriptionPlan updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.SubscriptionPlanService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `SubscriptionPlan deleted successfully`,
      data: result,
    });
  }
}
