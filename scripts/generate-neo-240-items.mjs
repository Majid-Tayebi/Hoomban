/**
 * @deprecated Use scripts/import-neo-240-from-pdf.mjs for official PDF items.
 * Kept as a thin wrapper for backwards compatibility.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const importScript = join(__dirname, 'import-neo-240-from-pdf.mjs');

const result = spawnSync(process.execPath, [importScript, ...process.argv.slice(2)], {
	stdio: 'inherit'
});
process.exit(result.status ?? 1);
