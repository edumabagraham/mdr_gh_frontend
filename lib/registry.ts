import axios from './axios';
import { csrf } from './auth';

/*
 * Types for the slice 1 API contract. Keys stay snake_case: they are the
 * server's names for these fields, and renaming them on the way in means every
 * future mismatch shows up as an undefined at render time rather than a failed
 * request.
 */

export type PatientStatus = 'active' | 'deceased' | 'withdrawn' | 'transferred' | 'merged';
export type Sex = 'male' | 'female' | 'other' | 'unknown';
export type VisitStatus =
  | 'scheduled'
  | 'arrived'
  | 'in_progress'
  | 'complete'
  | 'missed'
  | 'cancelled';
export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';

/** The patient summary embedded in dashboard and search rows. */
export interface PatientRef {
  id: number;
  registry_no: string;
  name: string;
  age?: number;
  age_is_estimated?: boolean;
  sex?: Sex;
}

export interface ClinicItem {
  visit_id: number;
  patient: PatientRef;
  type: string;
  status: VisitStatus;
  arrived_at: string | null;
  waiting_minutes: number | null;
}

export interface UnfinishedItem {
  administration_id: string;
  patient: PatientRef;
  instrument: string;
  started_at: string;
  sync_state: SyncState;
}

export interface OverdueItem {
  patient: PatientRef;
  scheduled_for: string;
  days_overdue: number;
  date_last_seen: string | null;
  contact_attempts: number;
}

export interface RecentlySeenItem {
  patient: PatientRef;
  completed_at: string;
}

export interface DashboardSectionData<T> {
  count: number;
  items: T[];
}

export interface Dashboard {
  generated_at: string;
  todays_clinic: DashboardSectionData<ClinicItem> & { waiting: number };
  unfinished_work: DashboardSectionData<UnfinishedItem>;
  overdue_followup: DashboardSectionData<OverdueItem>;
  recently_seen: DashboardSectionData<RecentlySeenItem>;
}

export interface SearchResult {
  id: number;
  registry_no: string;
  name: string;
  date_of_birth: string | null;
  dob_estimated: boolean;
  sex: Sex;
  status: PatientStatus;
  date_last_seen: string | null;
  identifiers: { system: string; value: string }[];
  similarity?: number;
  merged_into?: { id: number; registry_no: string };
}

export interface SearchResponse {
  query: string;
  matched_by: 'registry_no' | 'identifier' | 'name' | 'phone';
  results: SearchResult[];
}

export async function getDashboard(): Promise<Dashboard> {
  const response = await axios.get<Dashboard>('/api/dashboard');
  return response.data;
}

export async function searchPatients(query: string, limit = 20): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>('/api/patients/search', {
    params: { q: query, limit },
  });
  return response.data;
}

/**
 * True when the string looks like a registry number rather than a name.
 *
 * Mirrors RegistryNumber::canonicalise closely enough to decide what the
 * search box is being handed; the server does the authoritative check.
 */
export function looksLikeRegistryNumber(input: string): boolean {
  return /^mdr[-\s]?\d{6}[-\s]?\d{2}$/i.test(input.trim());
}

/* -- Registration, gated by duplicate detection ------------------------- */

export type DuplicateVerdict = 'block' | 'warn' | 'clear';
export type DuplicateDecision = 'no_match' | 'new_person_despite_match';

export interface DuplicateCandidate {
  patient: {
    id: number;
    registry_no: string;
    name: string;
    date_of_birth: string | null;
    age: number | null;
    age_is_estimated: boolean;
  };
  /** e.g. identifier_match, name_similarity, dob_within_2_years, phone_match */
  reasons: string[];
  similarity?: number;
}

export interface DuplicateCheckResponse {
  verdict: DuplicateVerdict;
  duplicate_check_token: string;
  candidates: DuplicateCandidate[];
}

export interface PatientIdentifierInput {
  system: string;
  value: string;
  is_primary?: boolean;
}

export interface NewPatient {
  /** Client-generated UUID. Makes registration idempotent across retries. */
  client_ref: string;
  family_name: string;
  given_name: string;
  other_names?: string | null;
  sex: Sex;
  date_of_birth: string | null;
  dob_estimated: boolean;
  /**
   * Supplied instead of a date of birth when the patient does not know it.
   * Stored as the number given, anchored to enrolment — the server never
   * fabricates a date of birth from it.
   */
  estimated_age?: number | null;
  phone_primary?: string | null;
  /** A second number for the patient. Retention over years depends on it. */
  phone_alt?: string | null;
  /** The person who answers when the patient's own phone is dead. */
  contact_name?: string | null;
  contact_relationship?: string | null;
  contact_phone?: string | null;
  /** Aids tracing, and discriminates duplicates. */
  residence_district?: string | null;
  identifiers: PatientIdentifierInput[];
  folder_absent_reason?: string | null;
  duplicate_check_token?: string;
  duplicate_decision?: DuplicateDecision;
}

export interface Patient {
  id: number;
  registry_no: string;
  family_name: string;
  given_name: string;
  other_names: string | null;
  name: string;
  sex: Sex;
  date_of_birth: string | null;
  dob_estimated: boolean;
  estimated_age?: number | null;
  age: number | null;
  age_is_estimated: boolean;
  status: PatientStatus;
  identifiers: { system: string; value: string; is_primary: boolean }[];
}

/**
 * Coded reasons a folder number may be missing.
 *
 * Mirrors config/identifiers.php on the API, which is authoritative. Free text
 * is not accepted: a reason nobody can count is a reason nobody acts on.
 */
export const FOLDER_ABSENT_REASONS: { value: string; label: string }[] = [
  { value: 'not_yet_issued', label: 'Folder not yet issued' },
  { value: 'patient_does_not_have_it', label: 'Patient does not have it with them' },
  { value: 'illegible', label: 'Folder number illegible' },
  { value: 'referred_from_elsewhere', label: 'Referred from another facility' },
];

export async function duplicateCheck(patient: NewPatient): Promise<DuplicateCheckResponse> {
  await csrf();
  const response = await axios.post<DuplicateCheckResponse>(
    '/api/patients/duplicate-check',
    patient
  );
  return response.data;
}

export async function createPatient(patient: NewPatient): Promise<Patient> {
  await csrf();
  const response = await axios.post<Patient>('/api/patients', patient);
  return response.data;
}
