import { IsIn, IsOptional } from 'class-validator';

export class ListGalleryDto {
  @IsOptional()
  @IsIn(['recentes', 'destaque', 'todos'])
  filter?: 'recentes' | 'destaque' | 'todos';
}
