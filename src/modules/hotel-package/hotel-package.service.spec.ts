import { Test, TestingModule } from '@nestjs/testing';
import { HotelPackageService } from './hotel-package.service';

describe('HotelPackageService', () => {
  let service: HotelPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelPackageService],
    }).compile();

    service = module.get<HotelPackageService>(HotelPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
