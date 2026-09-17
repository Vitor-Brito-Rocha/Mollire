import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, ThumbnailService],
  exports: [ThumbnailService],
})
export class GalleryModule {}
