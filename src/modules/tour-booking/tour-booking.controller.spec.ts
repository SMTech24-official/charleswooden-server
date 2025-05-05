import { Test, TestingModule } from '@nestjs/testing';
import { TourBookingController } from './tour-booking.controller';
import { TourBookingService } from './tour-booking.service';

describe('TourBookingController', () => {
  let controller: TourBookingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourBookingController],
      providers: [TourBookingService],
    }).compile();

    controller = module.get<TourBookingController>(TourBookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
