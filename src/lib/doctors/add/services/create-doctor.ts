import { pb } from '$lib/pocketbase';
import type { AddDoctorForm } from '../types';

export async function createDoctorFromForm(
	form: AddDoctorForm,
	photoFile: File | null
): Promise<{ ok: true; doctorId: string } | { ok: false; message: string }> {
	const mobile = form.phone.trim();
	const name = form.fullName.trim();
	const specialty = form.specialization || form.department;

	try {
		const ensureRes = await fetch('/api/auth/ensure-user', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(pb.authStore.token ? { Authorization: `Bearer ${pb.authStore.token}` } : {})
			},
			body: JSON.stringify({ mobile, role: 'doctor', name })
		});
		const ensureJson = await ensureRes.json();
		if (!ensureRes.ok) {
			return { ok: false, message: ensureJson.error || 'ایجاد کاربر متخصص ناموفق بود' };
		}

		const userId = String(ensureJson.record?.id || '');
		if (!userId) {
			return { ok: false, message: 'شناسه کاربر دریافت نشد' };
		}

		try {
			const existingStaff = await pb.collection('staff_registry').getList(1, 1, {
				filter: `mobile = "${mobile}"`
			});
			if (existingStaff.items.length) {
				await pb.collection('staff_registry').update(existingStaff.items[0].id, {
					name,
					role: 'doctor',
					active: form.isActive
				});
			} else {
				await pb.collection('staff_registry').create({
					mobile,
					name,
					role: 'doctor',
					active: form.isActive
				});
			}
		} catch {
			/* staff_registry optional if rules block secretary */
		}

		let existingDoctorId: string | null = null;
		try {
			const existing = await pb.collection('doctors').getFirstListItem(`user = "${userId}"`);
			existingDoctorId = existing.id;
		} catch {
			existingDoctorId = null;
		}

		const workingDays = form.workingDays.map((d) => ({
			day: d.day,
			enabled: d.enabled,
			startTime: d.startTime,
			endTime: d.endTime
		}));

		const aboutParts = [
			form.about.trim(),
			form.workType === 'full_time' ? 'نوع همکاری: تمام‌وقت' : 'نوع همکاری: پاره‌وقت',
			form.department ? `بخش: ${form.department}` : '',
			form.licenseNumber ? `مجوز: ${form.licenseNumber}` : '',
			form.address ? `آدرس: ${form.address}` : '',
			form.emergencyName
				? `تماس اضطراری: ${form.emergencyName} ${form.emergencyPhone}`.trim()
				: ''
		].filter(Boolean);

		const data = new FormData();
		data.append('user', userId);
		data.append('display_name', name);
		data.append('specialty', specialty);
		data.append('bio', aboutParts.join('\n'));
		data.append('visit_fee', String(form.visitFee || 0));
		data.append('slot_duration', String(form.slotDuration || 45));
		data.append('working_days', JSON.stringify(workingDays));
		data.append('is_active', form.isActive ? 'true' : 'false');
		data.append('sort_order', '0');
		if (form.licenseNumber.trim()) {
			data.append('license_number', form.licenseNumber.trim());
		}
		if (form.licenseExpiry) {
			data.append('license_expiry', form.licenseExpiry);
		}
		if (photoFile) data.append('photo', photoFile);

		const certFiles = form.certificates.map((c) => c.file).filter((f): f is File => Boolean(f));
		for (const file of certFiles) {
			data.append('certificates', file);
		}

		if (form.email.trim()) {
			try {
				await pb.collection('users').update(userId, {
					email: form.email.trim(),
					emailVisibility: true,
					name,
					mobile
				});
			} catch {
				/* email update may fail if duplicate */
			}
		}

		async function saveDoctor(payload: FormData) {
			if (existingDoctorId) {
				await pb.collection('doctors').update(existingDoctorId, payload);
				return existingDoctorId;
			}
			const created = await pb.collection('doctors').create(payload);
			return created.id;
		}

		try {
			const doctorId = await saveDoctor(data);
			return { ok: true, doctorId };
		} catch (firstErr) {
			// Retry without certificates if migration not applied yet
			if (certFiles.length) {
				data.delete('certificates');
				try {
					const doctorId = await saveDoctor(data);
					return {
						ok: true,
						doctorId
					};
				} catch {
					/* fall through */
				}
			}
			throw firstErr;
		}
	} catch (e: unknown) {
		return {
			ok: false,
			message: e instanceof Error ? e.message : 'خطا در ذخیره متخصص'
		};
	}
}
