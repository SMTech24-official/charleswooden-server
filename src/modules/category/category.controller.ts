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
import { CategoryService } from './category.service';
import { ParseDataPipe } from '@/pipes/parse_data';
import { ResponseService } from '@/utils/response';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { Public } from '../auth/auth.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly CategoryService: CategoryService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = JSON.parse(JSON.stringify(createCategoryDto));
    const result = await this.CategoryService.create({ ...data });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category created successfully`,
      data: result,
    });
  }

  @Public()
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.CategoryService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Categorys found successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.CategoryService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Category found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto?: UpdateCategoryDto,
  ) {
    const data = JSON.parse(JSON.stringify(updateCategoryDto));
    const result = await this.CategoryService.update(id, {
      ...data,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.CategoryService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Category deleted successfully`,
      data: result,
    });
  }
}
