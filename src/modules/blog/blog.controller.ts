import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
  Req,
  UploadedFile,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CustomFileFieldsInterceptor } from '@/helper/file_interceptor';
import { ParseDataPipe } from '@/pipes/parse_data';
import { FileService } from '@/helper/file.service';
import { CustomFileInterceptor } from '@/helper/file_interceptor_2';
import { ResponseService } from '@/utils/response';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseInterceptors(CustomFileInterceptor('img'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ParseDataPipe()) createBlogDto: string,
  ) {
    let img: string | null = null;
    if (file) {
      img = await this.fileService.uploadToDigitalOcean(file);
    }

    const data = JSON.parse(JSON.stringify(createBlogDto));
    const result = await this.blogService.create({ ...data, img });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `blog created successfully`,
      data: result,
    });
  }

  @Get()
  async findAll(@Query() query: Record<string, any>) {
    const result = await this.blogService.findAll(query);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `all blogs found successfully`,
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.blogService.findOne(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `single blog found successfully`,
      data: result,
    });
  }

  @Patch(':id')
  @UseInterceptors(CustomFileInterceptor('img'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body(new ParseDataPipe()) updateBlogDto?: string,
  ) {
    let img: string | null = null;
    if (file) {
      img = await this.fileService.uploadToDigitalOcean(file);
    }

    const data = JSON.parse(JSON.stringify(updateBlogDto));
    const result = await this.blogService.update(id, {
      ...data,
      ...(img && { img }),
    });

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `blog updated successfully`,
      data: result,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.blogService.remove(id);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: `blog deleted successfully`,
      data: result,
    });
  }
}
