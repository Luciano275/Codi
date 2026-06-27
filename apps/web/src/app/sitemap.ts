import { config } from '@codi/config';

export default function sitemap() {
  return [
    {
      url: config.frontendUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
