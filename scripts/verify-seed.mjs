import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('F:/Projects/Hoomban/pocketbase/pb_data/data.db', { readOnly: true });
console.log(
	'migrations',
	db.prepare("SELECT file FROM _migrations WHERE file LIKE '%178690%'").all()
);
console.log('doc cols', db.prepare('PRAGMA table_info(doctors)').all().map((c) => c.name));
console.log('users', db.prepare('SELECT name, role, mobile FROM users').all());
try {
	console.log('staff', db.prepare('SELECT mobile, role, name FROM staff_registry').all());
} catch (e) {
	console.log('staff err', e.message);
}
try {
	console.log('tests', db.prepare('SELECT title, slug FROM psych_tests').all());
} catch (e) {
	console.log('tests err', e.message);
}
try {
	console.log('doctors', db.prepare('SELECT id, bio, visit_fee FROM doctors').all());
} catch (e) {
	console.log('doctors err', e.message);
}
