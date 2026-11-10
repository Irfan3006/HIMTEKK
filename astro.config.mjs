// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Hash konten aset statis di /public untuk cache-busting (`?v=...`).
 * Aset di /css, /js, dan /assets dikirim dengan `Cache-Control: immutable`
 * (lihat vercel.json), jadi query versi wajib berubah saat isi file berubah.
 * @param {string} file path relatif dari root proyek
 */
const hash = (file) =>
  createHash('md5')
    .update(readFileSync(new URL(file, import.meta.url)))
    .digest('hex')
    .slice(0, 10);

// https://astro.build/config
export default defineConfig({
  site: 'https://himtekk.com',
  output: 'server',
  adapter: vercel(),
  trailingSlash: 'ignore',
  // Pertahankan whitespace HTML apa adanya agar tampilan identik dengan versi statis.
  compressHTML: false,
  devToolbar: { enabled: false },
  vite: {
    define: {
      __ASSET_VERSIONS__: JSON.stringify({
        tailwind: hash('./public/css/tailwind.min.css'),
        style: hash('./public/css/style.css'),
        script: hash('./public/js/script.js'),
      }),
    },
  },
});
