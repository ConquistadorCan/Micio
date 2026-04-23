import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;

export function useApi() {
  const { accessToken, user, login, logout } = useAuth();
  const navigate = useNavigate();

  async function apiFetch<T>(url: string, method: string, body?: unknown): Promise<T> {
    const fullUrl = `${BASE_URL}${url}`;

    const makeRequest = (token: string | null) =>
      fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  return { apiFetch };
}
