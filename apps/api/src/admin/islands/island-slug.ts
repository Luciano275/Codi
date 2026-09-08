import { BadRequestException } from '@nestjs/common';

export function createIslandSlug(title: string) {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new BadRequestException('No se pudo generar un slug válido');
  return slug;
}
