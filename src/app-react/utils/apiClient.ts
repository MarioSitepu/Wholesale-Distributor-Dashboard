export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const parseErrorMessage = async () => {
    const contentType = response.headers.get('Content-Type') || '';
    const text = await response.text();

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text);
        return parsed.message || parsed.error || text;
      } catch {
        return text;
      }
    }

    return text;
  };

  if (!response.ok) {
    let message = 'Terjadi kesalahan pada server';
    try {
      const errorMessage = await parseErrorMessage();
      message = errorMessage || message;
    } catch {
      // Ignored
    }
    throw new ApiError(response.status, message);
  }

  // Handle file downloads/blob response
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/csv')) {
    const text = await response.text();
    return { csv: text, filename: response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.csv' } as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestInit) => request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: any, options?: RequestInit) => request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: any, options?: RequestInit) => request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
};
