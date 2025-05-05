import { Public } from '@/modules/auth/auth.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { BookService } from './book.service';
import { FindOneParams } from './dto/get-one.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // @Public()
  @Post()
  @UseInterceptors(
    CustomFileFieldsInterceptor([{ name: 'images', maxCount: 1 }]),
  )
  async create(
    @UploadedFiles() files: { [fieldname: string]: Express.Multer.File[] },
    @Body('data') data: string, // Extract the JSON text field
  ) {
    console.log(`see file`, files);
    console.log(`see data`, data);
    // const createBookDto: CreateBookDto = JSON.parse(data);
    // createBookDto.img = file.path; // Set the file path

    // console.log(`see payload`, createBookDto);
    // console.log(`see file`, file);
    // return this.bookService.create(createBookDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(`see file`, file);
  }

  @Public()
  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    console.log(`see query`, query);
    return this.bookService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param() params: FindOneParams) {
    return this.bookService.findOne(params?.id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.BookUpdateInput) {
    return this.bookService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}
