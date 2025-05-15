import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ParseDataPipe } from '@/pipes/parse_data';
import { FileService } from '@/helper/file.service';
import { ResponseService } from '@/utils/response';
import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';
import { ReviewService } from './review.service';

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly ReviewService: ReviewService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 3 }]),
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body(new ParseDataPipe()) createReviewDto: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(createReviewDto));
    const result = await this.ReviewService.create({ ...data, images });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Review created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.ReviewService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Reviews found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.ReviewService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Review found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 3 }]),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body(new ParseDataPipe()) updateReviewDto?: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(updateReviewDto));
    const result = await this.ReviewService.update({
      id,
      data,
      images,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Review updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.ReviewService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Review deleted successfully`,
      data: result,
    });
  }
}
