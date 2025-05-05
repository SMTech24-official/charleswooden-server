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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CustomFileInterceptor } from '@/helper/file_interceptor_2';

@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly VehicleService: VehicleService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(CustomFileInterceptor('img'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ParseDataPipe()) createVehicleDto: string,
  ) {
    let img: string | null = null;
    if (file) {
      img = await this.fileService.uploadToDigitalOcean(file);
    }

    const data = JSON.parse(JSON.stringify(createVehicleDto));

    const result = await this.VehicleService.create({ ...data, img });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Vehicle created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.VehicleService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Vehicles found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.VehicleService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Vehicle found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(CustomFileInterceptor('img'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body(new ParseDataPipe()) updateVehicleDto?: string,
  ) {
    let img: string | null = null;
    if (file) {
      img = await this.fileService.uploadToDigitalOcean(file);
    }

    const data = JSON.parse(JSON.stringify(updateVehicleDto));
    const result = await this.VehicleService.update(id, {
      ...JSON.parse(JSON.stringify({ ...data, img })),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Vehicle updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.VehicleService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Vehicle deleted successfully`,
      data: result,
    });
  }
}
