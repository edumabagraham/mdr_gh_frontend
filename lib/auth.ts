import axios from './axios';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
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

export async function register(data: RegisterData): Promise<User> {
  await csrf();
  const response = await axios.post<User>('/api/register', data);
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