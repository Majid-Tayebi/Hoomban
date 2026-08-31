import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('F:/Projects/Hoomban/pocketbase/pb_data/data.db', { readOnly: true });
const cols = db.prepare("SELECT name FROM _collections WHERE name IN ('patient_profiles','clinical_notes','sms_outbox')").all();
console.log('collections', cols);
const mig = db.prepare("SELECT file FROM _migrations WHERE file LIKE '%178700%'").all();
console.log('migrations', mig);
try {
	const fields = JSON.parse(
		db.prepare("SELECT fields FROM _collections WHERE name='patient_profiles'").get()?.fields || '[]'
	);
	console.log(
		'patient_profiles fields',
		fields.map((f) => f.name)
	);
} catch (e) {
	console.log('no patient_profiles', e.message);
}
