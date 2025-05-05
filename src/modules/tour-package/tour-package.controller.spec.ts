import { Test, TestingModule } from '@nestjs/testing';
import { TourPackageController } from './tour-package.controller';
import { TourPackageService } from './tour-package.service';

describe('TourPackageController', () => {
  let controller: TourPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourPackageController],
      providers: [TourPackageService],
    }).compile();

    controller = module.get<TourPackageController>(TourPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
