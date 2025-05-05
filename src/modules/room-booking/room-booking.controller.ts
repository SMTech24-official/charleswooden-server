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
import { RoomBookingService } from './room-booking.service';
import { CreateRoomBookingDto } from './dto/create-room-booking.dto';
import { Roles } from '../roles/roles.decorator';
import { Role } from '@/enum/role.enum';

@Controller('room-bookings')
export class RoomBookingController {
  constructor(private readonly RoomBookingService: RoomBookingService) {}

  @Post()
  async create(
    @Body(new ParseDataPipe()) createRoomBookingDto: CreateRoomBookingDto,
  ) {
    const result = await this.RoomBookingService.create({
      ...JSON.parse(JSON.stringify(createRoomBookingDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `RoomBooking created successfully`,
      data: result,
    });
  }

  @Get()
  @Roles(Role.CUSTOMER)
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.RoomBookingService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all RoomBookings found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.RoomBookingService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single RoomBooking found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ParseDataPipe()) updateRoomBookingDto?: string,
  ) {
    const result = await this.RoomBookingService.update(id, {
      ...JSON.parse(JSON.stringify(updateRoomBookingDto)),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `RoomBooking updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.RoomBookingService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `RoomBooking deleted successfully`,
      data: result,
    });
  }

  @Get('pay/:id')
  async pay(@Param('id') id: string) {
    const result = await this.RoomBookingService.pay(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `RoomBooking payment successfully`,
      data: result,
    });
  }

  @Patch('cancel/:id')
  async cancel(@Param('id') id: string, @Body() body: any) {
    const { reason } = body;
    const result = await this.RoomBookingService.cancel(id, reason);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `RoomBooking cancelled successfully`,
      data: result,
    });
  }
}
