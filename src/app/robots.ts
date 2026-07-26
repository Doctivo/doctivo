import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/profile/',
        '/book/',
        '/patients/',
        '/appointments/',
        '/api/'
      ],
    },
    sitemap: 'https://doctivo.in/sitemap.xml',
  }
}
