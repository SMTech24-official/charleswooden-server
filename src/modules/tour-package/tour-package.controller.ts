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
  ValidationPipe,
  Req,
  UploadedFile,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ParseDataPipe } from '@/pipes/parse_data';
import { FileService } from '@/helper/file.service';
import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';
import { ResponseService } from '@/utils/response';
import { TourPackageService } from './tour-package.service';

@Controller('tour-packages')
export class TourPackageController {
  constructor(
    private readonly TourPackageService: TourPackageService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 5 }]),
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body(new ParseDataPipe()) createTourPackageDto: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(createTourPackageDto));
    const result = await this.TourPackageService.create({ ...data, images });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourPackage created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.TourPackageService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all TourPackages found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.TourPackageService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single TourPackage found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 5 }]),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files?: Record<string, Express.Multer.File[]>,
    @Body(new ParseDataPipe()) updateTourPackageDto?: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(updateTourPackageDto));
    const result = await this.TourPackageService.update(id, {
      ...data,
      ...(images?.length > 0 ? { images } : {}),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourPackage updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.TourPackageService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourPackage deleted successfully`,
      data: result,
    });
  }
}
