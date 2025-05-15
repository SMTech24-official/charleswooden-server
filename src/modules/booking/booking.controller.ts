import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ParseDataPipe } from '@/pipes/parse_data';
import { FileService } from '@/helper/file.service';
import { CustomFileInterceptor } from '@/helper/file_interceptor_2';
import { ResponseService } from '@/utils/response';
import { BookingService } from './booking.service';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('Bookings')
export class BookingController {
  constructor(private readonly BookingService: BookingService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  async create(@Body(new ParseDataPipe()) createBookingDto: CreateBookingDto) {
    const data = JSON.parse(JSON.stringify(createBookingDto));
    const result = await this.BookingService.create({ ...data });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Booking created successfully`,
      data: result,
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.CUSTOMER)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.BookingService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all Bookings found successfully`,
      data: result,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  async findOne(@Param('id') id: string) {
    const result = await this.BookingService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single Booking found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CUSTOMER)
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateBookingDto?: UpdateBookingDto,
  ) {
    const data = JSON.parse(JSON.stringify(updateBookingDto));
    const result = await this.BookingService.update(id, {
      ...data,
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Booking updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.BookingService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `Booking deleted successfully`,
      data: result,
    });
  }
}
