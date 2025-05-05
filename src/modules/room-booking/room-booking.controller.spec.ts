import { Test, TestingModule } from '@nestjs/testing';
import { RoomBookingController } from './room-booking.controller';
import { RoomBookingService } from './room-booking.service';

describe('RoomBookingController', () => {
  let controller: RoomBookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomBookingController],
      providers: [RoomBookingService],
    }).compile();

    controller = module.get<RoomBookingController>(RoomBookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
