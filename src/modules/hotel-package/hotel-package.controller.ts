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
import { HotelPackageService } from './hotel-package.service';

@Controller('hotel-packages')
export class HotelPackageController {
  constructor(
    private readonly HotelPackageService: HotelPackageService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 5 }]),
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body(new ParseDataPipe()) createHotelPackageDto: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      console.log(`hello`);
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(createHotelPackageDto));
    const result = await this.HotelPackageService.create({ ...data, images });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `HotelPackage created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.HotelPackageService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all HotelPackages found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.HotelPackageService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single HotelPackage found successfully`,
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
    @Body(new ParseDataPipe()) updateHotelPackageDto?: string,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = JSON.parse(JSON.stringify(updateHotelPackageDto));
    const result = await this.HotelPackageService.update(id, {
      ...data,
      ...(images?.length > 0 ? { images } : {}),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `HotelPackage updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.HotelPackageService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `HotelPackage deleted successfully`,
      data: result,
    });
  }
}
