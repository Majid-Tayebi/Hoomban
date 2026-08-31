import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

const path = 'F:/Projects/Hoomban/pocketbase/pb_data/data.db';
console.log('exists', fs.existsSync(path));
const db = new DatabaseSync(path, { readOnly: true });
console.log('tables', db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all());
console.log('collections', db.prepare('SELECT id, name, type FROM _collections').all());

for (const row of db.prepare('SELECT name, fields FROM _collections').all()) {
	let fields = [];
	try {
		fields = JSON.parse(row.fields).map((f) => `${f.name}:${f.type}`);
	} catch {
		fields = ['parse-error'];
	}
	console.log(`\n# ${row.name}`);
	console.log(fields.join(', '));
}
