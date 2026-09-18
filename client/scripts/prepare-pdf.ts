/** Copy PDF.js assets to public/pdfjs before dev/build so PDF previews work. */
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.resolve('pdfjs-dist/package.json')));
const publicPdfjs = join(process.cwd(), 'public', 'pdfjs');
const assetFolders = ['cmaps', 'standard_fonts', 'wasm'] as const;

mkdirSync(publicPdfjs, { recursive: true });

for (const folder of assetFolders) {
  cpSync(join(packageRoot, folder), join(publicPdfjs, folder), { recursive: true });
}

cpSync(join(packageRoot, 'build', 'pdf.worker.min.mjs'), join(publicPdfjs, 'pdf.worker.min.mjs'));
