export type * from './types';
export {
	loadPatientsPageData,
	filterPatients,
	getGenderLabel,
	getStatusConfig,
	formatAdmissionDate
} from './services/patients-data';
export type { PatientsQuery, PatientsPageResult } from './services/patients-data';
