import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const CustomFileFieldsInterceptor = (
  fields: { name: string; maxCount?: number }[],
  uploadPath: string = 'tmp',
) => {
  return FileFieldsInterceptor(fields, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
  });
};
