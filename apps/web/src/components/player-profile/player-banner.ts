import type { CSSProperties } from 'react';

export const playerBanners = [
  {
    id: 'BOSQUE',
    name: 'Bosque arcano',
    description: 'Violeta profundo',
    surfaceClass: 'bg-bosque-800',
    borderClass: 'border-bosque-500',
    ornamentClass: 'text-bosque-300',
    accent: '#7b68ee',
    accentSoft: '#d5ceff',
    accentWash: '#f0edff',
    accentInk: '#2a2460',
    accentShadow: '#b8adff',
  },
  {
    id: 'DESIERTO',
    name: 'Dunas del saber',
    description: 'Ámbar de expedición',
    surfaceClass: 'bg-desierto-700',
    borderClass: 'border-desierto-300',
    ornamentClass: 'text-desierto-200',
    accent: '#ff9600',
    accentSoft: '#ffe0b3',
    accentWash: '#fff3e0',
    accentInk: '#663c00',
    accentShadow: '#ffcc80',
  },
  {
    id: 'CASTILLO',
    name: 'Salón del campeón',
    description: 'Oro de la corona',
    surfaceClass: 'bg-castillo-800',
    borderClass: 'border-castillo-300',
    ornamentClass: 'text-castillo-200',
    accent: '#d4b43a',
    accentSoft: '#fcecb3',
    accentWash: '#fef8e0',
    accentInk: '#6d5e1d',
    accentShadow: '#fbe080',
  },
  {
    id: 'PRADERA',
    name: 'Sendero verde',
    description: 'Energía de aventura',
    surfaceClass: 'bg-pradera-800',
    borderClass: 'border-pradera-300',
    ornamentClass: 'text-pradera-100',
    accent: '#58cc02',
    accentSoft: '#d9f5b0',
    accentWash: '#f0fde4',
    accentInk: '#1d4a00',
    accentShadow: '#bceb78',
  },
  {
    id: 'ROSAL',
    name: 'Rosal de campaña',
    description: 'Rosa intenso',
    surfaceClass: 'bg-[#8b2856]',
    borderClass: 'border-[#f7a8c8]',
    ornamentClass: 'text-[#ffd6e5]',
    accent: '#ed5f98',
    accentSoft: '#ffc4da',
    accentWash: '#fff0f6',
    accentInk: '#74183f',
    accentShadow: '#e99ab9',
  },
  {
    id: 'LAVANDA',
    name: 'Bruma lavanda',
    description: 'Lila sereno',
    surfaceClass: 'bg-[#5e3d86]',
    borderClass: 'border-[#d9bdff]',
    ornamentClass: 'text-[#ede0ff]',
    accent: '#a56bdb',
    accentSoft: '#dec5fb',
    accentWash: '#f7f0ff',
    accentInk: '#4a236f',
    accentShadow: '#c39be8',
  },
  {
    id: 'CORAL',
    name: 'Marea coral',
    description: 'Coral cálido',
    surfaceClass: 'bg-[#9c3f5f]',
    borderClass: 'border-[#ffb0c2]',
    ornamentClass: 'text-[#ffe0e8]',
    accent: '#f27697',
    accentSoft: '#ffc9d6',
    accentWash: '#fff1f4',
    accentInk: '#78203c',
    accentShadow: '#ee9eb2',
  },
] as const;

export type PlayerBannerId = (typeof playerBanners)[number]['id'];

export function getPlayerBanner(bannerId: string) {
  return playerBanners.find((banner) => banner.id === bannerId) ?? playerBanners[0];
}

type PlayerBannerTheme = CSSProperties & {
  '--profile-accent': string;
  '--profile-accent-soft': string;
  '--profile-accent-wash': string;
  '--profile-accent-ink': string;
  '--profile-accent-shadow': string;
};

export function getPlayerBannerTheme(bannerId: string): PlayerBannerTheme {
  const banner = getPlayerBanner(bannerId);

  return {
    '--profile-accent': banner.accent,
    '--profile-accent-soft': banner.accentSoft,
    '--profile-accent-wash': banner.accentWash,
    '--profile-accent-ink': banner.accentInk,
    '--profile-accent-shadow': banner.accentShadow,
  };
}
