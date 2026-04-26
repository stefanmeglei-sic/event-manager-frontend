import { apiFetch } from './client';
import type { TokenResponse, User } from '../types';

export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiFetch<User>('/auth/me', { token });
}
