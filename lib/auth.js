import axios from './axios';

export async function csrf() {
  await axios.get('/sanctum/csrf-cookie');
}

export async function register(data) {
  await csrf();
  const res = await axios.post('/api/register', data);
  return res.data;
}

export async function login(credentials) {
  await csrf();
  const res = await axios.post('/api/login', credentials);
  return res.data;
}

export async function logout() {
  await axios.post('/api/logout');
}

export async function getUser() {
  const res = await axios.get('/api/user');
  return res.data;
}