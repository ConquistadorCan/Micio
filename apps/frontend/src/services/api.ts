import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;
type RequestOptions = Pick<RequestInit, 'signal'>

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function buildApiError(response: Response) {
  let message = `Request failed: ${response.status}`

  try {
    const data = await response.json() as { message?: string }
    if (data.message) message = data.message
  } catch {
    // Ignore non-JSON error responses and fall back to status-based messaging.
  }

  return new ApiError(response.status, message)
}

export function useApi() {
  const { accessToken, user, login, logout } = useAuth();
  const navigate = useNavigate();

  const authFetch = useCallback(async <T,>(url: string, method: string, body?: unknown, options?: RequestOptions): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw await buildApiError(response);
    }

    return response.json() as Promise<T>;
  }, []);

  const apiFetch = useCallback(async <T,>(url: string, method: string, body?: unknown, options?: RequestOptions): Promise<T> => {
    const fullUrl = `${BASE_URL}${url}`;

    const makeRequest = (token: string | null) =>
      fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

    let response = await makeRequest(accessToken);

    if (response.status === 401) {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshResponse.ok) {
        logout();
        navigate('/login');
        throw new Error('Session expired');
      }

      const { accessToken: newToken } = await refreshResponse.json();
      login(newToken, user!);
      response = await makeRequest(newToken);
    }

    if (!response.ok) {
      throw await buildApiError(response);
    }

    return response.json() as Promise<T>;
  }, [accessToken, login, logout, navigate, user]);

  return { apiFetch, authFetch };
}
