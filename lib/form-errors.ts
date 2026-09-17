import Axios from 'axios';
import { ValidationErrorResponse } from './auth';

/**
 * What a failed form submission leaves the page with.
 */
export interface FormFailure {
  /** Field errors from a 422, keyed the way Laravel keys them. */
  errors: Record<string, string[]>;
  /** Shown above the form when the failure was not field-level. */
  message: string | null;
}

/**
 * Turn whatever a rejected axios call threw into something renderable.
 *
 * TypeScript types a caught error as `unknown`, so a type guard is required
 * before reading error.response. The status code is most of the story:
 *
 *   422 → validation failed; the body carries per-field messages
 *   429 → a rate limiter refused the request
 *   401 → no valid session; the caller should send the user to /login
 *   419 → CSRF token missing or mismatched
 *   no response at all → the API is not running or CORS blocked the call
 */
export function toFormFailure(error: unknown): FormFailure {
  if (Axios.isAxiosError<ValidationErrorResponse>(error)) {
    const status = error.response?.status;
    const body = error.response?.data;

    if (status === 422 && body) {
      return Object.keys(body.errors ?? {}).length > 0
        ? { errors: body.errors, message: null }
        : { errors: {}, message: body.message };
    }

    if (status === 429) {
      return { errors: {}, message: 'Too many attempts. Wait a minute, then try again.' };
    }

    if (status) {
      console.error('Request failed:', status, body);
      return { errors: {}, message: `The server answered with status ${status}.` };
    }

    return { errors: {}, message: 'Could not reach the server. Is php artisan serve running?' };
  }

  console.error(error);

  return { errors: {}, message: 'Something unexpected went wrong.' };
}
