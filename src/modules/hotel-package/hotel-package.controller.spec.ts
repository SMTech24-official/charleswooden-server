import { Test, TestingModule } from '@nestjs/testing';
import { HotelPackageController } from './hotel-package.controller';
import { HotelPackageService } from './hotel-package.service';

describe('HotelPackageController', () => {
  let controller: HotelPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelPackageController],
      providers: [HotelPackageService],
    }).compile();

    controller = module.get<HotelPackageController>(HotelPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
