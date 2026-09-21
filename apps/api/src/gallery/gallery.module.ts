import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProgressModule } from '../progress/progress.module';
import { UptimeModule } from '../uptime/uptime.module';
import { XpModule } from '../xp/xp.module';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  imports: [ActivityModule, XpModule, UptimeModule, ProgressModule],
  controllers: [GalleryController],
  providers: [GalleryService, ThumbnailService],
  exports: [ThumbnailService],
})
export class GalleryModule {}
