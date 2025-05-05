import { Test, TestingModule } from '@nestjs/testing';
import { TourBookingService } from './tour-booking.service';

describe('TourBookingService', () => {
  let service: TourBookingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TourBookingService],
    }).compile();

    service = module.get<TourBookingService>(TourBookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
