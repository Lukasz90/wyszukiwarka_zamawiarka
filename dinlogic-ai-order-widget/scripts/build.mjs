import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'public', 'src');
const buildDir = path.join(root, 'public', 'build');

await mkdir(buildDir, { recursive: true });

await build({
    entryPoints: [path.join(srcDir, 'widget.ts')],
    bundle: true,
    outfile: path.join(buildDir, 'widget.js'),
    format: 'iife',
    target: ['es2018'],
    sourcemap: true,
    minify: true,
});

const cssSourcePath = path.join(srcDir, 'styles', 'widget.css');
const cssContents = await readFile(cssSourcePath, 'utf8');
await writeFile(path.join(buildDir, 'widget.css'), cssContents, 'utf8');

console.log('Build completed.');
