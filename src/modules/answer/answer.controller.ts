import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AnswerService } from './answer.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { ResponseService } from '@/utils/response';
import { Request } from 'express';

@Controller('answer')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  async create(@Body() createAnswerDto: CreateAnswerDto[]) {
    const result = await this.answerService.create(createAnswerDto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Ans submitted successfully',
      data: result,
    });
  }

  @Get()
  @Roles(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Req() req: Request) {
    const result = await this.answerService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Answers retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.answerService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Category found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, updateAnswerData?: UpdateAnswerDto) {
    const result = await this.answerService.update(id, {
      ...updateAnswerData,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Answer updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.answerService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Answer deleted successfully`,
      data: result,
    });
  }
}
