import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { ParseDataPipe } from '@/pipes/parse_data';
import { CustomFileInterceptor } from '@/helper/file_interceptor_2';
import { ResponseService } from '@/utils/response';

@Controller('questions')
export class QuestionController {
  constructor(private readonly QuestionService: QuestionService) {}

  @Post()
  @UseInterceptors(CustomFileInterceptor('img'))
  async create(@Body(new ParseDataPipe()) createQuestionDto: string) {
    const data = JSON.parse(JSON.stringify(createQuestionDto));
    const result = await this.QuestionService.create({ ...data });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Question created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.QuestionService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Questions found successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.QuestionService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Question found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(CustomFileInterceptor('img'))
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateQuestionDto?: string,
  ) {
    const data = JSON.parse(JSON.stringify(updateQuestionDto));
    const result = await this.QuestionService.update(id, {
      ...data,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Question updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.QuestionService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Question deleted successfully`,
      data: result,
    });
  }
}
