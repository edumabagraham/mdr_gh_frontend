import axios from './axios';

/** The four roles the registry recognises. */
export type Role = 'admin' | 'clinician' | 'research_assistant' | 'data_manager';

export type AccountStatus = 'active' | 'suspended' | 'departed';

/**
 * The account, exactly as UserResource returns it. The API deliberately does
 * not send the access-control columns, so nothing here should be added without
 * a matching change on that resource.
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  specialty: string | null;
  email_verified_at: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

/** What an invited person fills in to turn their invitation into an account. */
export interface AcceptInvitationData {
  token: string;
  name: string;
  password: string;
  password_confirmation: string;
  specialty?: string;
  grade?: string;
  department?: string;
  mdc_number?: string;
}

/** Shape of a Laravel 422 response body. */
export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

/**
 * Ask Laravel for a CSRF cookie.
 *
 * Note there is no /api prefix — Sanctum registers this route at the root.
 * It must be called before any POST, or Laravel rejects the request with 419.
 */
export async function csrf(): Promise<void> {
  await axios.get('/sanctum/csrf-cookie');
}

/**
 * Turn an invitation into an account.
 *
 * There is no self-registration: the role comes from the invitation, not from
 * anything typed here. On success the session is already signed in, so the
 * caller can go straight to the email verification step.
 */
export async function acceptInvitation(data: AcceptInvitationData): Promise<User> {
  await csrf();
  const response = await axios.post<User>('/api/invitations/accept', data);
  return response.data;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  await csrf();
  const response = await axios.post<User>('/api/login', credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  await axios.post('/api/logout');
}

/**
 * Fetch the currently authenticated user.
 *
 * Throws a 401 when no valid session exists, which is how the dashboard
 * decides whether to redirect to the login page.
 */
export async function getUser(): Promise<User> {
  const response = await axios.get<User>('/api/user');
  return response.data;
}
export interface ResetPasswordData {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

/** Endpoints that report an outcome rather than returning a resource. */
export interface MessageResponse {
  message: string;
}

/**
 * Confirm the signed-in user's email address with the code that was mailed.
 *
 * A wrong, expired or exhausted code comes back as a 422 with the reason under
 * `errors.code`, so the verification form renders it like any field error.
 */
export async function verifyEmail(code: string): Promise<User> {
  await csrf();
  const response = await axios.post<User>('/api/email/verify', { code });
  return response.data;
}

/** Mail a fresh code, which invalidates whichever code is outstanding. */
export async function resendVerificationCode(): Promise<MessageResponse> {
  await csrf();
  const response = await axios.post<MessageResponse>('/api/email/resend');
  return response.data;
}

/**
 * Start the forgotten-password flow.
 *
 * The reply is the same whether or not the address has an account — the API
 * will not confirm who is registered — so the UI must not promise an email.
 */
export async function forgotPassword(email: string): Promise<MessageResponse> {
  await csrf();
  const response = await axios.post<MessageResponse>('/api/forgot-password', { email });
  return response.data;
}

/** Finish the forgotten-password flow with the emailed code. */
export async function resetPassword(data: ResetPasswordData): Promise<MessageResponse> {
  await csrf();
  const response = await axios.post<MessageResponse>('/api/reset-password', data);
  return response.data;
}
