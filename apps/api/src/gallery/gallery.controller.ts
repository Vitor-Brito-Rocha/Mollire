import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ListGalleryDto } from './dto/list-gallery.dto';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  list(@Query() query: ListGalleryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.galleryService.list(query.filter, user.id);
  }

  @Post(':slug/star')
  star(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.galleryService.star(slug, user.id);
  }

  @Delete(':slug/star')
  unstar(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.galleryService.unstar(slug, user.id);
  }
}
