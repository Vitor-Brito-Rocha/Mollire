import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  imports: [ActivityModule],
  controllers: [GalleryController],
  providers: [GalleryService, ThumbnailService],
  exports: [ThumbnailService],
})
export class GalleryModule {}
