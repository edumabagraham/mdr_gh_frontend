// import Axios from 'axios';

// const axios = Axios.create({
//   baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
//   headers: { 'X-Requested-With': 'XMLHttpRequest' },
//   withCredentials: true,
//   withXSRFToken: true,
// });

// export default axios;

import Axios, { AxiosInstance } from 'axios';

/**
 * Shared axios instance for talking to the Laravel API.
 *
 * Four settings here are load-bearing. Removing any one of them breaks
 * authentication in a way that is hard to diagnose:
 *
 *   withCredentials  – sends the session cookie on cross-origin requests.
 *                      Without it every protected route returns 401.
 *
 *   withXSRFToken    – reads Laravel's XSRF-TOKEN cookie and echoes it back
 *                      as a header. Required in axios 1.x; its absence is the
 *                      usual cause of an unexplained 419.
 *
 *   Accept           – tells Laravel to return JSON errors rather than an
 *                      HTML redirect, so validation errors parse correctly.
 *
 *   X-Requested-With – marks the request as AJAX, which Sanctum checks when
 *                      deciding whether to use session authentication.
 */
const axios: AxiosInstance = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000',
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  withXSRFToken: true,
});

export default axios;