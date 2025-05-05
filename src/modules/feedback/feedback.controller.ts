import { FileService } from '@/helper/file.service';
import { ParseDataPipe } from '@/pipes/parse_data';
import { ResponseService } from '@/utils/response';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FeedBackService } from './feedback.service';

@Controller('feedbacks')
export class FeedBackController {
  constructor(
    private readonly feedBackService: FeedBackService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  async create(@Body(new ParseDataPipe()) createFeedBackDto: string) {
    const result = await this.feedBackService.create({
      ...JSON.parse(JSON.stringify(createFeedBackDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `FeedBack created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.feedBackService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all FeedBacks found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.feedBackService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single FeedBack found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateFeedBackDto?: string,
  ) {
    const result = await this.feedBackService.update(id, {
      ...JSON.parse(JSON.stringify(updateFeedBackDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `FeedBack updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.feedBackService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `FeedBack deleted successfully`,
      data: result,
    });
  }
}
