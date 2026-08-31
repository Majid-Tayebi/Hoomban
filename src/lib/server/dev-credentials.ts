/** Dev quick-login password (PB requires min 8 chars). Server-only — never import in client code. */
export const DEV_LOGIN_PASSWORD = '12341234';

export const DEV_ROLE_ACCOUNTS = [
	{ username: 'admin', label: 'مدیر', role: 'admin' },
	{ username: 'secretary', label: 'منشی', role: 'secretary' },
	{ username: 'doctor', label: 'روانشناس', role: 'doctor' },
	{ username: 'writer', label: 'نویسنده', role: 'writer' },
	{ username: 'patient', label: 'مراجع', role: 'patient' }
] as const;
