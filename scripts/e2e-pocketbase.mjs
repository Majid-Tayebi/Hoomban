import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pbDir = path.join(root, 'pocketbase');

try {
	if (process.platform === 'win32') {
		execSync(
			'Get-Process pocketbase -ErrorAction SilentlyContinue | Stop-Process -Force',
			{ shell: 'powershell.exe', stdio: 'ignore' }
		);
	} else {
		execSync('pkill -f pocketbase || true', { stdio: 'ignore' });
	}
} catch {
	/* no running instance */
}

function resolvePbBinary(): string {
	const win = path.join(pbDir, 'pocketbase.exe');
	if (existsSync(win)) return win;
	const unix = path.join(pbDir, 'pocketbase');
	if (existsSync(unix)) return unix;
	const ci = path.join(root, 'pocketbase-bin', 'pocketbase');
	if (existsSync(ci)) return ci;
	throw new Error('PocketBase binary not found. Place pocketbase.exe in pocketbase/ or run CI download step.');
}

const pb = resolvePbBinary();

function run(args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(pb, args, { cwd: pbDir, stdio: 'inherit', shell: false });
		child.on('error', reject);
		child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pocketbase ${args.join(' ')} exited ${code}`))));
	});
}

await run(['migrate']);
const serve = spawn(pb, ['serve', '--http=127.0.0.1:8090'], { cwd: pbDir, stdio: 'inherit', shell: false });
serve.on('error', (err) => {
	console.error(err);
	process.exit(1);
});

const shutdown = () => {
	serve.kill('SIGTERM');
	process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
