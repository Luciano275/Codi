export const playerBanners = [
  {
    id: 'BOSQUE',
    name: 'Bosque arcano',
    description: 'Violeta profundo',
    surfaceClass: 'bg-bosque-800',
    borderClass: 'border-bosque-500',
    ornamentClass: 'text-bosque-300',
  },
  {
    id: 'DESIERTO',
    name: 'Dunas del saber',
    description: 'Ámbar de expedición',
    surfaceClass: 'bg-desierto-700',
    borderClass: 'border-desierto-300',
    ornamentClass: 'text-desierto-200',
  },
  {
    id: 'CASTILLO',
    name: 'Salón del campeón',
    description: 'Oro de la corona',
    surfaceClass: 'bg-castillo-800',
    borderClass: 'border-castillo-300',
    ornamentClass: 'text-castillo-200',
  },
  {
    id: 'PRADERA',
    name: 'Sendero verde',
    description: 'Energía de aventura',
    surfaceClass: 'bg-pradera-800',
    borderClass: 'border-pradera-300',
    ornamentClass: 'text-pradera-100',
  },
] as const;

export type PlayerBannerId = (typeof playerBanners)[number]['id'];

export function getPlayerBanner(bannerId: string) {
  return playerBanners.find((banner) => banner.id === bannerId) ?? playerBanners[0];
}
