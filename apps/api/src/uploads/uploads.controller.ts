import {
  BadRequestException,
  Body,
  Controller,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { User } from '@codi/database';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { S3Service } from '../s3/s3.service';
import { LessonAssetUploadDto } from './dto/lesson-asset-upload.dto';
import type { UploadedFile as StoredUpload } from '../s3/s3.service';

const avatarFilePipe = new ParseFilePipeBuilder()
  .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
  .build();

const lessonFilePipe = new ParseFilePipeBuilder()
  .addMaxSizeValidator({ maxSize: 500 * 1024 * 1024 })
  .build();

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly s3: S3Service) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  createAvatarUpload(@CurrentUser() user: User, @UploadedFile(avatarFilePipe) file: StoredUpload) {
    return this.s3.uploadPending(user.id, 'avatar', file);
  }

  @Post('lesson-asset')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  createLessonUpload(
    @CurrentUser() user: User,
    @Body() dto: LessonAssetUploadDto,
    @UploadedFile(lessonFilePipe) file: StoredUpload,
  ) {
    if (dto.assetType !== 'lesson-pdf' && dto.assetType !== 'lesson-video') {
      throw new BadRequestException('Tipo de carga inválido');
    }
    return this.s3.uploadPending(user.id, dto.assetType, file);
  }
}
