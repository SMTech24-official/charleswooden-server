import { Test, TestingModule } from '@nestjs/testing';
import { TourPackageService } from './tour-package.service';

describe('TourPackageService', () => {
  let service: TourPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TourPackageService],
    }).compile();

    service = module.get<TourPackageService>(TourPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
