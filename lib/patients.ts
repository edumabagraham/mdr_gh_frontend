import axios from './axios';
import { csrf } from './auth';

/* Types mirroring the slice 2 patient record contract. */

export type Certainty = 'established' | 'probable' | 'possible' | 'suspected';

export interface PatientDiagnosis {
  id: number;
  code: string;
  label: string;
  certainty: Certainty;
  diagnosed_on: string;
  diagnosed_by: string | null;
  criteria_set: string | null;
  /** Derived from symptom onset by the API; null when onset is unknown. */
  disease_duration_years: number | null;
  revision_count: number;
}

export interface DiagnosisHistoryEntry {
  id: number;
  code: string;
  label: string;
  certainty: Certainty;
  module: string | null;
  diagnosed_on: string;
  diagnosed_by: string | null;
  criteria_set: string | null;
  rationale: string | null;
  is_current: boolean;
  superseded_at: string | null;
  recorded_at: string | null;
}

export interface PatientModule {
  module: string;
  label: string;
  stage_instrument: string | null;
  is_primary: boolean;
  opened_at: string;
}

export interface PatientPanel {
  panel: string;
  label: string;
  trigger: string;
  trigger_context: Record<string, unknown> | null;
  opened_at: string;
}

export interface PatientAlert {
  kind: string;
  severity: 'high' | 'medium' | 'low';
  text: string;
}

/** One instrument and whether it can be administered today. */
export interface PlannedAssessment {
  code?: string;
  module?: string;
  label: string;
  domain?: string;
  instrument?: string;
  is_primary?: boolean;
  available: boolean;
}

/**
 * Core instruments apply to every patient regardless of label and are
 * available from registration; module instruments wait for a diagnosis.
 */
export interface AssessmentPlan {
  core: PlannedAssessment[];
  module: PlannedAssessment[];
}

export interface PatientRecord {
  id: number;
  registry_no: string;
  name: string;
  age: number | null;
  /** True when the age came from an approximate age rather than a birth date. */
  age_is_estimated: boolean;
  estimated_age?: number | null;
  sex: string;
  status: string;
  date_of_birth: string | null;
  dob_estimated: boolean;
  date_last_seen: string | null;
  phone_primary: string | null;
  phone_alt: string | null;
  contact_name: string | null;
  contact_relationship: string | null;
  contact_phone: string | null;
  residence_district: string | null;
  /** Months since the last completed visit, derived by the API. */
  months_since_seen: number | null;
  identifiers: { system: string; value: string; is_primary: boolean }[];
  symptom_onset_on: string | null;
  symptom_onset_estimated: boolean;
  first_symptom: string | null;
  side_of_onset: string | null;
  diagnosis: PatientDiagnosis | null;
  modules: PatientModule[];
  panels: PatientPanel[];
  alerts: PatientAlert[];
  assessments: AssessmentPlan;
  merged_into?: { id: number; registry_no: string };
}

export interface VocabularyGroup {
  module: string;
  label: string;
  stage_instrument: string | null;
  diagnoses: { code: string; label: string; module: string; criteria_set: string | null }[];
}

export interface Vocabulary {
  certainties: Certainty[];
  groups: VocabularyGroup[];
}

export interface RecordDiagnosisData {
  code: string;
  certainty: Certainty;
  diagnosed_on: string;
  criteria_set?: string | null;
  rationale?: string;
}

export async function getPatientRecord(registryNo: string): Promise<PatientRecord> {
  const response = await axios.get<PatientRecord>(`/api/patients/${registryNo}`);
  return response.data;
}

export async function getDiagnosisHistory(
  registryNo: string
): Promise<{ diagnoses: DiagnosisHistoryEntry[]; revision_count: number }> {
  const response = await axios.get<{ diagnoses: DiagnosisHistoryEntry[]; revision_count: number }>(
    `/api/patients/${registryNo}/diagnoses`
  );
  return response.data;
}

/** The dropdown, served from config so the client never carries clinical vocabulary. */
export async function getVocabulary(): Promise<Vocabulary> {
  const response = await axios.get<Vocabulary>('/api/diagnoses/vocabulary');
  return response.data;
}

export async function recordDiagnosis(
  registryNo: string,
  data: RecordDiagnosisData
): Promise<unknown> {
  await csrf();
  const response = await axios.post(`/api/patients/${registryNo}/diagnoses`, data);
  return response.data;
}

export interface SymptomOnsetData {
  symptom_onset_on: string | null;
  symptom_onset_estimated: boolean;
  first_symptom?: string | null;
  side_of_onset?: string | null;
}

/** Sides of onset the API accepts. Mirrors the patients_side_of_onset_check. */
export const SIDE_OF_ONSET_OPTIONS: { value: string; label: string }[] = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'axial', label: 'Axial' },
];

export async function updateSymptomOnset(
  registryNo: string,
  data: SymptomOnsetData
): Promise<PatientRecord> {
  await csrf();
  const response = await axios.patch<PatientRecord>(`/api/patients/${registryNo}`, data);
  return response.data;
}

export async function setPrimaryModule(registryNo: string, module: string): Promise<unknown> {
  await csrf();
  const response = await axios.patch(`/api/patients/${registryNo}/modules/${module}/primary`);
  return response.data;
}

export async function closeModule(
  registryNo: string,
  module: string,
  reason: string
): Promise<unknown> {
  await csrf();
  const response = await axios.post(`/api/patients/${registryNo}/modules/${module}/close`, {
    reason,
  });
  return response.data;
}

export const CERTAINTY_LABELS: Record<Certainty, string> = {
  established: 'Clinically established',
  probable: 'Clinically probable',
  possible: 'Possible',
  suspected: 'Suspected',
};
