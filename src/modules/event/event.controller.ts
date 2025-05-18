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
  Req,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';
import { ParseFormDataInterceptor } from '@/helper/form_data_interceptor';
import { FileService } from '@/helper/file.service';
import { ResponseService } from '@/utils/response';
import { Roles } from '../roles/roles.decorator';

import { Request } from 'express';
import { Role } from '@/enum/role.enum';

@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 3 }]),
    ParseFormDataInterceptor,
  )
  async create(
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() createEventDto: CreateEventDto,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const data = { ...createEventDto, slug: '' };
    const result = await this.eventService.create(data, images);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Event created successfully',
      data: result,
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.CUSTOMER)
  async findAll(@Req() req: Request) {
    const result = await this.eventService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Event retrieved successfully`,
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.eventService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Category found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 3 }]),
    ParseFormDataInterceptor,
  )
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    @Body() updateEventData?: UpdateEventDto,
  ) {
    let images: string[] | null = [];

    const uploadableFiles = files?.images;

    if (Array.isArray(uploadableFiles) && uploadableFiles?.length > 0) {
      images =
        await this.fileService.uploadMultipleToDigitalOcean(uploadableFiles);
    }

    const result = await this.eventService.update(id, updateEventData, images);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Event updated successfully`,
      data: result,
    });
  }

  @Delete('destroy/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    const result = await this.eventService.destroy(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Image deleted successfully`,
      data: result,
    });
  }
}
