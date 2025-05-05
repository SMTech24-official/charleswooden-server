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
import { ParseDataPipe } from '@/pipes/parse_data';
import { ResponseService } from '@/utils/response';
import { TourBookingService } from './tour-booking.service';

@Controller('tour-bookings')
export class TourBookingController {
  constructor(private readonly TourBookingService: TourBookingService) {}

  @Post()
  async create(@Body(new ParseDataPipe()) createTourBookingDto: string) {
    const result = await this.TourBookingService.create({
      ...JSON.parse(JSON.stringify(createTourBookingDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourBooking created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.TourBookingService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all TourBookings found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.TourBookingService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single TourBooking found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateTourBookingDto?: string,
  ) {
    const result = await this.TourBookingService.update(id, {
      ...JSON.parse(JSON.stringify(updateTourBookingDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourBooking updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.TourBookingService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourBooking deleted successfully`,
      data: result,
    });
  }

  @Get('pay/:id')
  async pay(@Param('id') id: string) {
    const result = await this.TourBookingService.pay(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourBooking payment successfully`,
      data: result,
    });
  }

  @Patch('cancel/:id')
  async cancel(@Param('id') id: string, @Body() body: any) {
    const { reason } = body;
    const result = await this.TourBookingService.cancel(id, reason);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `TourBooking cancelled successfully`,
      data: result,
    });
  }
}
