
import { apiRequest } from "./queryClient";

const getBaseUrl = () => {
  const port = import.meta.env.VITE_BACKEND_PORT || 5000;
  return `http://localhost:${port}`;
};

const api = {
  get: async (path: string) => {
    const url = `${getBaseUrl()}${path}`;
    const response = await apiRequest("GET", url);
    return response.json();
  },

  post: async (path: string, data: any, options?: { responseType?: 'json' | 'blob' }) => {
    const url = `${getBaseUrl()}${path}`;
    const response = await apiRequest("POST", url, data);

    if (options?.responseType === 'blob') {
      return response.blob();
    }
    return response.json();
  },

  // Add other methods like put, delete if needed by the application
};

export { api };
