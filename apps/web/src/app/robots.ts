import { config } from '@codi/config';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${config.frontendUrl}/sitemap.xml`,
  };
}
