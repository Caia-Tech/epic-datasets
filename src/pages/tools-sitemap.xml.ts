import type { APIRoute } from 'astro';

const tools = [
  // Core Utilities (High Priority)
  { url: '/tools/json', priority: 0.9, changefreq: 'weekly' },
  { url: '/tools/base64', priority: 0.9, changefreq: 'weekly' },
  { url: '/tools/uuid', priority: 0.8, changefreq: 'monthly' },
  { url: '/tools/url', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/hex', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/binary', priority: 0.7, changefreq: 'monthly' },
  
  // Security & Crypto (High Priority)
  { url: '/tools/hash', priority: 0.9, changefreq: 'weekly' },
  { url: '/tools/password', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/jwt', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/rsa', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/bcrypt', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/aes', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/pgp', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ssh-key', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/ssl', priority: 0.7, changefreq: 'monthly' },
  
  // Text & Format (Medium Priority)
  { url: '/tools/diff', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/regex', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/markdown', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/case', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/lorem', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/word-counter', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/text-stats', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/escape', priority: 0.6, changefreq: 'monthly' },
  
  // Code Tools (High Priority)
  { url: '/tools/minify', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/beautify', priority: 0.8, changefreq: 'weekly' },
  { url: '/tools/sql', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/js-formatter', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/css-formatter', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/prettify', priority: 0.7, changefreq: 'weekly' },
  
  // Data Formats (Medium Priority)
  { url: '/tools/yaml', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/xml', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/csv', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/html-entities', priority: 0.6, changefreq: 'monthly' },
  
  // Network & Web (Medium Priority)
  { url: '/tools/api', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/webhook', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/dns', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ip', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ports', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/http', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ua', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/mime', priority: 0.5, changefreq: 'monthly' },
  
  // Generators (Medium Priority)
  { url: '/tools/qr', priority: 0.7, changefreq: 'weekly' },
  { url: '/tools/barcode', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ascii-art', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/color', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/favicon', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/meta', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/robots', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/sitemap', priority: 0.6, changefreq: 'monthly' },
  
  // Time & Date (Low Priority)
  { url: '/tools/timestamp', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/date-format', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/cron', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/pomodoro', priority: 0.5, changefreq: 'monthly' },
  
  // Validators (Medium Priority)
  { url: '/tools/email-validator', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/url-validator', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/credit-card', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/unicode', priority: 0.5, changefreq: 'monthly' },
  
  // DevOps (Medium Priority)
  { url: '/tools/docker', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/git', priority: 0.7, changefreq: 'monthly' },
  { url: '/tools/chmod', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/htpasswd', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/cert', priority: 0.6, changefreq: 'monthly' },
  
  // Converters (Low Priority)
  { url: '/tools/unit', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/number-base', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/colors', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/image', priority: 0.6, changefreq: 'monthly' },
  { url: '/tools/ascii', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/entity', priority: 0.5, changefreq: 'monthly' },
  { url: '/tools/encryption', priority: 0.6, changefreq: 'monthly' },
];

export const GET: APIRoute = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Tools Index Page -->
  <url>
    <loc>https://caiatech.com/tools/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${tools.map(tool => `
  <url>
    <loc>https://caiatech.com${tool.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${tool.changefreq}</changefreq>
    <priority>${tool.priority}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};